import Yoga, { type Edge } from "yoga-wasm-web/auto";
import type {
    DOMRect,
    GridToken,
    Point,
    Stdout,
    DomElement,
    YogaNode,
} from "../Types.js";
import { Pen } from "./Pen.js";
import { stringifyRowSegment } from "../shared/StringifyGrid.js";
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
    el: DomElement;
    grid?: Grid;
    corner?: Point;
    canvasHeight?: number;
    canvasWidth?: number;
    limits?: Limits;

    // Rects
    unclippedRect?: Rect;
    unclippedContentRect?: Rect;
    visibleRect?: Rect;
};

export type SubCanvasDeps = Required<CanvasDeps>;

export class Canvas {
    public grid: Grid;
    public el: DomElement;
    public readonly corner: Readonly<Point>;
    public readonly limits: Limits;
    public readonly canvasHeight: number;
    public readonly canvasWidth: number;

    private readonly _unclippedRect: Rect;
    private readonly _unclippedContentRect: Rect;
    private readonly _visibleRect: Rect;
    private readonly _visibleContentRect: Rect | null; // on demand

    protected readonly stdout: CanvasDeps["stdout"]; // Only used in root Canvas

    constructor(deps: CanvasDeps) {
        this.stdout = deps.stdout;
        this.el = deps.el;
        this.grid = deps.grid ?? [];
        this.corner = deps.corner ?? { x: 0, y: 0 };

        this.limits = {
            minX: Math.max(0, deps.limits?.minX ?? 0),
            minY: Math.max(0, deps.limits?.minY ?? 0),
            maxX: deps.limits?.maxX ?? deps.stdout.columns,
            maxY: deps.limits?.maxY ?? deps.stdout.rows,
        };

        this.canvasHeight = deps.canvasHeight ?? this.limits.maxY - this.limits.minY;
        this.canvasWidth = deps.canvasWidth ?? this.limits.maxX - this.limits.minX;

        this._unclippedRect = deps.unclippedRect ?? {
            corner: this.corner,
            height: this.canvasHeight,
            width: this.canvasWidth,
        };

        this._unclippedContentRect = deps.unclippedContentRect ?? this._unclippedRect;
        this._visibleRect = deps.visibleRect ?? this._unclippedRect;
        this._visibleContentRect = null;
    }

    /**
     * Represents the dimensions of the node without any mutations arising from
     * overflow settings in the overall layout.
     */
    public get unclippedRect(): Rect {
        return this._unclippedRect;
    }

    /**
     * Represents the *content* dimensions of a given node.
     *
     * In other words, drawable dimensions a child node would given should this
     * node restrict its overflow, which takes into account borders, padding,
     * scrollbars set on this node.
     * */
    public get unclippedContentRect(): Rect {
        return this._unclippedContentRect;
    }

    /**
     * Represents the *visible* dimensions of a given node, which takes into
     * account the overflow settings in the overall layout.
     * */
    public get visibleRect(): Rect {
        return this._visibleRect ?? this.getClippedRect(this._unclippedRect, this.limits);
    }

    /**
     * @see `unclippedContentRect` and `visibleRect`
     *
     * Represents the *content* dimensions of the *visible* portion of the node.
     * */
    public get visibleContentRect(): Rect {
        // visibleContentRect is created *on demand*
        return (
            this._visibleContentRect ??
            this.getClippedRect(this._unclippedContentRect, this.limits)
        );
    }

    public createChildCanvas(child: DomElement): SubCanvas {
        const canvasWidth = child.node.getComputedWidth();
        const canvasHeight =
            child instanceof TextElement
                ? child.textHeight
                : child.node.getComputedHeight();

        // Child corner depends on parent corner.
        const childCorner: Canvas["corner"] = {
            x: this.corner.x + child.node.getComputedLeft() + this.el.scrollOffset.x,
            y: this.corner.y + child.node.getComputedTop() + this.el.scrollOffset.y,
        };

        const unclippedChild = this.getUnclippedRect(
            childCorner,
            child.node,
            canvasHeight,
        );
        const unclippedChildContent = this.getUnclippedContentRect(
            childCorner,
            child.node,
            canvasHeight,
        );

        // SubCanvas limits are inherited from the parent and are only clamped
        // when the parent restricts overflow.
        const childLimits = { ...this.limits };

        // Clamp child limits according to parent overflow
        if (this.overFlowIsHidden()) {
            const visContent = this.visibleContentRect;

            if (this.xOverflowIsHidden()) {
                childLimits.minX = visContent.corner.x;
                childLimits.maxX = visContent.corner.x + visContent.width;
            }
            if (this.yOverflowIsHidden()) {
                childLimits.minY = visContent.corner.y;
                childLimits.maxY = visContent.corner.y + visContent.height;
            }
        }

        const childVisRect = this.getClippedRect(unclippedChild, childLimits);

        return new SubCanvas({
            canvasHeight,
            canvasWidth,
            unclippedRect: unclippedChild,
            unclippedContentRect: unclippedChildContent,
            limits: childLimits,
            visibleRect: childVisRect,
            corner: childCorner,
            stdout: this.stdout,
            grid: this.grid,
            el: child,
        });
    }

    private getUnclippedRect(corner: Point, node: YogaNode, canvasHeight?: number): Rect {
        return {
            corner: corner,
            height: canvasHeight ?? node.getComputedHeight(),
            width: node.getComputedWidth(),
        };
    }

    private getUnclippedContentRect(
        corner: Point,
        node: YogaNode,
        canvasHeight?: number,
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
            height: (canvasHeight ?? node.getComputedHeight()) - bottomOff - topOff,
            width: node.getComputedWidth() - leftOff - rightOff,
        };
    }

    /**
     * Returns a new `Rect` with its dimensions clipped to overflow restrictions.
     * */
    private getClippedRect(rect: Rect, limits: Limits): Rect {
        let { x, y } = rect.corner;
        let xDepth = x + rect.width;
        let yDepth = y + rect.height;

        x = this.clampNumToLimits(x, limits.minX, limits.maxX);
        y = this.clampNumToLimits(y, limits.minY, limits.maxY);
        xDepth = this.clampNumToLimits(xDepth, limits.minX, limits.maxX);
        yDepth = this.clampNumToLimits(yDepth, limits.minY, limits.maxY);

        return {
            corner: { x, y },
            height: yDepth - y,
            width: xDepth - x,
        };
    }

    private clampNumToLimits(num: number, min: number, max: number): number {
        if (num < min) return min;
        if (num > max) return max;
        return num;
    }

    public getDomRect(): DOMRect {
        const vis = this.getClippedRect(this.unclippedRect, this.limits);

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

    protected overFlowIsHidden() {
        return this.xOverflowIsHidden() || this.yOverflowIsHidden();
    }

    protected xOverflowIsHidden() {
        return (
            this.el.shadowStyle.overflowX === "hidden" ||
            this.el.shadowStyle.overflowX === "scroll"
        );
    }

    protected yOverflowIsHidden() {
        return (
            this.el.shadowStyle.overflowY === "hidden" ||
            this.el.shadowStyle.overflowY === "scroll"
        );
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

    public stringifyGrid(): { newLines: number; output: string } {
        let newLines = 0;
        const output = this.grid
            .map((_row, y) => {
                const nl = y === this.grid.length - 1 ? "" : "\n";
                if (nl) ++newLines;

                // prettier-ignore
                return this
                    .stringifyRowSegment(y)
                    .trimEnd() + nl;
            })
            .join("");

        return { newLines, output };
    }

    /**
     * Determines if drawing this node will actually perform any operations, or
     * if it will always try to draw past its limits.
     *
     * If the `unclippedRect` bleeds into the limits box, then it can be drawn.
     * Otherwise it cannot.  This doesn't stop children of the node from having
     * unclipped rects that bleed into the limits though.  For rendering purposes,
     * elements will never draw past their unclipped rect dimensions.
     * */
    public canDraw(): boolean {
        return this.visibleRect.height > 0 && this.visibleRect.width > 0;
    }
}

export class SubCanvas extends Canvas {
    constructor(deps: SubCanvasDeps) {
        super(deps);
    }

    private forceGridToAccomodate() {
        const currDepth = this.grid.length;
        const requestedDepth = Math.min(
            this.corner.y + this.canvasHeight,
            this.limits.maxY,
        );
        const rowsNeeded = requestedDepth - currDepth;

        for (let i = 0; i < rowsNeeded; ++i) {
            this.requestNewRow();
        }
    }

    private requestNewRow() {
        if (this.grid.length < this.limits.maxY) {
            this.grid.push(
                Array.from({ length: this.stdout.columns }).fill(" ") as string[],
            );
        }
    }

    /**
     * The root canvas is recreated on every cycle, and therefore receives a new
     * grid on every pass as well.  The child canvases are only recreated on
     * layout changes, so the root/children lifecycles are mismatched and this
     * leads to grid mismatches unless bound every cycle.
     * */
    public bindGrid(rootCanvasGrid: Grid) {
        this.grid = rootCanvasGrid;
        this.forceGridToAccomodate();
    }
}
