import type {
    DOMRect,
    GridToken,
    Point,
    YogaNode,
    ShadowStyle,
    Stdout,
} from "../Types.js";
import { Pen } from "./Pen.js";
import { stringifyRowSegment } from "../shared/StringifyGrid.js";

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

export type Grid = (string | GridToken)[][];

export type CanvasDeps = {
    stdout: Stdout;
    grid?: Grid;
    corner?: Point;
    nodeHeight?: number;
    nodeWidth?: number;
    minX?: number;
    minY?: number;
    maxX?: number;
    maxY?: number;
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
    public readonly nodeHeight: number;
    public readonly nodeWidth: number;

    private readonly stdout: CanvasDeps["stdout"]; // Only used in root Canvas

    constructor(deps: CanvasDeps) {
        this.stdout = deps.stdout;
        this.grid = deps.grid ?? [];
        this.corner = deps.corner ?? { x: 0, y: 0 };

        this.minX = Math.max(0, deps.minX ?? 0);
        this.minY = Math.max(0, deps.minY ?? 0);
        this.maxX = deps.maxX ?? deps.stdout.columns;
        this.maxY = deps.maxY ?? deps.stdout.rows;
        this.nodeHeight = deps.nodeHeight ?? this.maxY - this.minY;
        this.nodeWidth = deps.nodeWidth ?? this.maxX - this.minX;

        this.pos = { ...this.corner };
    }

    public createChildCanvas({
        childNode,
        childStyle,
        parentStyle,
    }: {
        childNode: YogaNode;
        childStyle: ShadowStyle;
        parentStyle: ShadowStyle;
    }) {
        const chNodeWidth = childNode.getComputedWidth();
        const chNodeHeight = childNode.getComputedHeight();

        /**
         * `Child Corner`
         * It is possible for child corner values to be outside of their limits
         * and this is okay.  `Pen` objects won't draw outside of the canvas limits.
         */
        const corner: Canvas["corner"] = {
            x: this.corner.x + childNode.getComputedLeft(),
            y: this.corner.y + childNode.getComputedTop(),
        };

        // Subcanvas limits depend on parent canvas limits.
        let { minX, minY, maxX, maxY } = this;

        // If child has overflow as hidden, then min/max values are clamped
        if (childStyle.overflowX === "hidden") {
            // if (corner.x < minX) minX = minX;
            if (corner.x > minX) minX = corner.x;
            if (minX > maxX) minX = maxX;

            if (corner.x + chNodeWidth < maxX) maxX = corner.x + chNodeWidth;
        }
        if (childStyle.overflowY === "hidden") {
            // if (corner.x < minY) minY = minY;
            if (corner.y > minY) minY = corner.y;
            if (minY > maxY) minY = maxY;

            if (corner.y + chNodeHeight < maxY) maxY = corner.y + chNodeHeight;
        }

        // If the parent has overflow set, we need to adjust the child's limits
        // for any borders the parent may have
        const visBorders = this.getVisibleBorders();
        if (parentStyle.overflowX === "hidden") {
            if (parentStyle.borderLeft && visBorders.left) ++minX;
            if (parentStyle.borderRight && visBorders.right) --maxX;
        }
        if (parentStyle.overflowY === "hidden") {
            if (parentStyle.borderTop && visBorders.top) ++minY;
            if (parentStyle.borderBottom && visBorders.bottom) --maxY;
        }

        return new SubCanvas({
            minX,
            minY,
            maxX,
            maxY,
            corner,
            nodeHeight: chNodeHeight,
            nodeWidth: chNodeWidth,
            stdout: this.stdout,
            grid: this.grid,
        });
    }

    public getDomRect(): DOMRect {
        let { x, y } = this.corner;
        x = Math.max(x, this.minX);
        x = Math.min(x, this.maxX);
        y = Math.max(y, this.minY);
        y = Math.min(y, this.maxY);

        const top = y;
        const left = x;

        let height = this.nodeHeight;
        let width = this.nodeWidth;

        if (x + width > this.maxX) {
            width = this.maxX - x;
        }
        if (y + height > this.maxY) {
            height = this.maxY - y;
        }

        const right = x + width;
        const bottom = y + height;

        return {
            x,
            y,
            top,
            left,
            right,
            bottom,
            height,
            width,
        };
    }

    protected getVisibleBorders() {
        // prettier-ignore
        let left = false;
        let right = false;
        let bottom = false;
        let top = false;

        if (this.corner.x >= this.minX) left = true;
        if (this.corner.y >= this.minY) top = true;
        if (this.corner.x + this.nodeWidth <= this.maxX) right = true;
        if (this.corner.y + this.nodeHeight <= this.maxY) bottom = true;

        return { left, right, top, bottom };
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
        const requestedDepth = Math.min(this.corner.y + this.nodeHeight, this.maxY);
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
