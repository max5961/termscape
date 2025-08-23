import Yoga, { type Edge } from "yoga-wasm-web/auto";
import type {
    DOMRect,
    GridToken,
    Point,
    Stdout,
    DomElement,
    ShadowStyle,
    YogaNode,
} from "../Types.js";
import { Pen } from "./Pen.js";
import { stringifyRowSegment } from "../shared/StringifyGrid.js";
import { DOM_ELEMENT_SCROLL_OFFSET, DOM_ELEMENT_SHADOW_STYLE } from "../Symbols.js";
import { TextElement } from "../dom/TextElement.js";

/**
 * The Canvas contains a reference to the 2d Grid that is drawn to as well as
 * metadata used by DomElement's in order to draw to the Grid. The metadata
 * includes the the corner of the DomElement as calculated by Yoga and the min/max
 * `x` and `y` values which are derived from the overflow style values.  Canvases
 * can create SubCanvases which decide their extrema based on the parent.
 *
 * Each Canvas/SubCanvas can create a Pen object which draws to the Grid in the
 * Draw class.  The created Pen short circuits when attempting to draw outside
 * of the Canvas's limits.  This allows the Draw class to control the Pen while
 * being fully agnostic of where it can and can't draw.  The only context the Draw
 * class needs is the top-left corner position of the Node its drawing.
 *
 * The Pen class draws either raw characters or Tokens to the Grid.  Tokens
 * contain metadata about the ANSI styling. The Canvas class contains logic to
 * 'stringify' a row or segment of a row so it can be written to stdout.
 */

export type Rect = {
    corner: Point;
    height: number;
    width: number;
};

export type Limits = {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
};

export type Grid = (string | GridToken)[][];

export type CanvasDeps = {
    stdout: Stdout;
    grid?: Grid;
    corner?: Point;
    realHeight?: number;
    realWidth?: number;
    minX?: number;
    minY?: number;
    maxX?: number;
    maxY?: number;
    unclippedRect?: Rect;
    unclippedContentRect?: Rect;
};

export type SubCanvasDeps = Required<CanvasDeps>;

export class Canvas {
    public pos: Point;
    public readonly grid: Grid;
    public readonly corner: Readonly<Point>;
    public readonly minX: number;
    public readonly minY: number;
    public readonly maxX: number;
    public readonly maxY: number;
    public readonly realHeight: number;
    public readonly realWidth: number;
    public readonly unclippedRect: Rect;
    public readonly unclippedContentRect: Rect;

    private readonly stdout: CanvasDeps["stdout"]; // Only used in root Canvas

    constructor(deps: CanvasDeps) {
        this.stdout = deps.stdout;
        this.grid = deps.grid ?? [];
        this.corner = deps.corner ?? { x: 0, y: 0 };

        this.minX = Math.max(0, deps.minX ?? 0);
        this.minY = Math.max(0, deps.minY ?? 0);
        this.maxX = deps.maxX ?? deps.stdout.columns;
        this.maxY = deps.maxY ?? deps.stdout.rows;
        this.realHeight = deps.realHeight ?? this.maxY - this.minY;
        this.realWidth = deps.realWidth ?? this.maxX - this.minX;

        this.unclippedRect = deps.unclippedRect ?? {
            corner: this.corner,
            height: this.realHeight,
            width: this.realWidth,
        };

        this.unclippedContentRect = deps.unclippedContentRect ?? {
            corner: this.corner,
            height: this.realHeight,
            width: this.realWidth,
        };

        this.pos = { ...this.corner };
    }

    public createChildCanvas({ child, elem }: { child: DomElement; elem: DomElement }) {
        const chNode = child.node;

        const chStyle = child[DOM_ELEMENT_SHADOW_STYLE];
        const elemStyle = elem[DOM_ELEMENT_SHADOW_STYLE];
        const scrollOffset = elem[DOM_ELEMENT_SCROLL_OFFSET];

        const realWidth = chNode.getComputedWidth();
        let realHeight = chNode.getComputedHeight();

        if (child instanceof TextElement) {
            realHeight = child.textHeight;
        }

        // Child corner depends on parent corner.
        const chCorner: Canvas["corner"] = {
            x: this.corner.x + chNode.getComputedLeft() + scrollOffset.x,
            y: this.corner.y + chNode.getComputedTop() + scrollOffset.y,
        };

        // Subcanvas limits are inherited its parent and are only clamped when
        // in the context of overflows set to hidden.
        let { minX, minY, maxX, maxY } = this;

        const clampLimits = (visRect: Rect, style: ShadowStyle) => {
            if (this.hasHiddenXOverflow(style)) {
                minX = visRect.corner.x;
                maxX = visRect.corner.x + visRect.width;
            }
            if (this.hasHiddenYOverflow(style)) {
                minY = visRect.corner.y;
                maxY = visRect.corner.y + visRect.height;
            }
        };

        const unclipped = this.getUnclippedRect(chCorner, chNode, realHeight);
        const unclippedContent = this.getUnclippedContentRect(
            chCorner,
            chNode,
            realHeight,
        );

        // PRE-CLAMP child to its vis rect
        // (unnecessary so long as the Draw class does its job properly)
        if (this.hasHiddenOverflow(chStyle)) {
            const visRect = this.getVisRect(unclipped, { minX, minY, maxX, maxY });
            clampLimits(visRect, chStyle);
        }

        // Clamp child to the parent's content rect
        if (this.hasHiddenOverflow(elemStyle)) {
            const rect = this.unclippedContentRect;
            const visRect = this.getVisRect(rect, { minX, minY, maxX, maxY });
            clampLimits(visRect, elemStyle);
        }

        return new SubCanvas({
            minX,
            minY,
            maxX,
            maxY,
            realHeight,
            realWidth,
            unclippedRect: unclipped,
            unclippedContentRect: unclippedContent,
            corner: chCorner,
            stdout: this.stdout,
            grid: this.grid,
        });
    }

    /**
     * This is the box agnostic of any overflow settings from ancestor nodes.
     */
    public getUnclippedRect(corner: Point, node: YogaNode, realHeight?: number): Rect {
        return {
            corner: corner,
            height: realHeight ?? node.getComputedHeight(),
            width: node.getComputedWidth(),
        };
    }

    /**
     * This is the content box of a node.  In other words, this is the unclipped
     * rect but with the borders, padding, and anything else such as scrollbars
     * clipped away.
     * */
    public getUnclippedContentRect(
        corner: Point,
        node: YogaNode,
        realHeight?: number,
    ): Rect {
        let leftOff, rightOff, bottomOff, topOff;
        leftOff = rightOff = bottomOff = topOff = 0;

        const getOffset = (edge: Edge) => {
            return Math.floor(
                node.getComputedBorder(edge) + node.getComputedPadding(edge),
            );
        };

        leftOff += getOffset(Yoga.EDGE_LEFT);
        rightOff += getOffset(Yoga.EDGE_RIGHT);
        bottomOff += getOffset(Yoga.EDGE_BOTTOM);
        topOff += getOffset(Yoga.EDGE_TOP);

        const offsetCorner: Point = {
            x: corner.x + leftOff,
            y: corner.y + topOff,
        };

        return {
            corner: offsetCorner,
            height: (realHeight ?? node.getComputedHeight()) - bottomOff - topOff,
            width: node.getComputedWidth() - leftOff - rightOff,
        };
    }

    public getVisRect(rect: Rect, limits: Limits): Rect {
        let { x, y } = rect.corner;
        x = Math.max(x, limits.minX);
        x = Math.min(x, limits.maxX);
        y = Math.max(y, limits.minY);
        y = Math.min(y, limits.maxY);

        let { height, width } = rect;

        if (x + width > limits.maxX) {
            width = Math.max(0, limits.maxX - x);
        }
        if (y + height > limits.maxY) {
            height = Math.max(0, limits.maxY - y);
        }

        return {
            corner: { x, y },
            height,
            width,
        };
    }

    public getVisContentRect(): Rect {
        return this.getVisRect(this.unclippedContentRect, {
            maxX: this.maxX,
            maxY: this.maxY,
            minX: this.minX,
            minY: this.minY,
        });
    }

    public getDomRect(): DOMRect {
        const vis = this.getVisRect(this.unclippedRect, {
            maxX: this.maxX,
            maxY: this.maxY,
            minX: this.minX,
            minY: this.minY,
        });

        return {
            x: vis.corner.x,
            y: vis.corner.y,
            top: vis.corner.y,
            left: vis.corner.x,
            right: vis.corner.x + vis.width,
            bottom: vis.corner.y + vis.height,
            height: vis.height,
            width: vis.width,
        };
    }

    protected hasHiddenOverflow(style: ShadowStyle) {
        return this.hasHiddenXOverflow(style) || this.hasHiddenYOverflow(style);
    }

    protected hasHiddenXOverflow(style: ShadowStyle) {
        return style.overflowX === "hidden" || style.overflowX === "scroll";
    }

    protected hasHiddenYOverflow(style: ShadowStyle) {
        return style.overflowY === "hidden" || style.overflowY === "scroll";
    }

    public getPen(): Pen {
        return new Pen({
            grid: this.grid,
            canvas: this,
        });
    }

    public stringifyRowSegment(y: number, start?: number, end?: number): string {
        return stringifyRowSegment(this.grid, y, start, end);
    }
}

class SubCanvas extends Canvas {
    constructor(deps: SubCanvasDeps) {
        super(deps);
        this.forceGridToAccomodate();
    }

    private forceGridToAccomodate() {
        const currDepth = this.grid.length;
        const requestedDepth = Math.min(this.corner.y + this.realHeight, this.maxY);
        const rowsNeeded = requestedDepth - currDepth;

        for (let i = 0; i < rowsNeeded; ++i) {
            this.requestNewRow();
        }
    }

    private requestNewRow() {
        if (this.grid.length < this.maxY) {
            this.grid.push(
                Array.from({ length: process.stdout.columns }).fill(" ") as string[],
            );
        }
    }
}
