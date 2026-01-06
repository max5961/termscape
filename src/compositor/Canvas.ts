import { TEXT_ELEMENT, Yg } from "../Constants.js";
import { stringifyRowSegment } from "../shared/StringifyGrid.js";
import { Pen } from "./Pen.js";
import type { DomElement } from "../dom/DomElement.js";
import type { Root } from "../dom/RootElement.js";
import type { DOMRect, Edge, GridToken, Point, Stdout } from "../Types.js";

export type Grid = (string | GridToken)[][];

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

/**
 * Each Canvas corresponds to a DomElement and stores Rect and Limits data used
 * during compositing. Unclipped rects are based on the Yoga layout, whereas
 * clipped rects are dependent on the limits context from parent Canvases.
 *
 * Each Canvas contains a reference to the RootCanvas's 2d grid and can create a
 * Pen object, which safely draws only within its limits.  This allows the Draw
 * class to be free of any 'can I draw here' checks.
 *
 * Limits represent the maximum or minimum drawable area.  Even though none of
 * the elements intentionally draw outside of their ygHeight and ygWidth, there is
 * nothing stopping child elements from doing so if the limits are not constrained
 * */
export abstract class Canvas {
    public abstract readonly host: DomElement;
    public abstract corner: Point;
    public abstract stdout: Stdout;
    public abstract grid: Grid;
    public abstract limits: Limits;
    public abstract ygHeight: number;
    public abstract ygWidth: number;

    protected _unclippedRect: Rect | undefined = undefined;
    public get unclippedRect() {
        this._unclippedRect ??= this.getUnclippedRect();
        return this._unclippedRect;
    }

    protected _unclippedContentRect: Rect | undefined = undefined;
    public get unclippedContentRect() {
        this._unclippedContentRect ??= this.getUnclippedContentRect();
        return this._unclippedContentRect;
    }

    protected _visRect: Rect | undefined = undefined;
    public get visRect() {
        this._visRect ??= this.getVisRect();
        return this._visRect;
    }

    protected _visContentRect: Rect | undefined = undefined;
    public get visContentRect() {
        this._visContentRect ??= this.getVisContentRect();
        return this._visContentRect;
    }

    protected resetRects() {
        this._unclippedRect = undefined;
        this._unclippedContentRect = undefined;
        this._visRect = undefined;
        this._visContentRect = undefined;
    }

    protected getUnclippedRect(): Rect {
        return {
            corner: { ...this.corner },
            width: this.ygWidth,
            height: this.ygHeight,
        };
    }

    protected getUnclippedContentRect(): Rect {
        const node = this.host._node;
        const getOffset = (edge: Edge) => {
            return Math.floor(
                node.getComputedBorder(edge) + node.getComputedPadding(edge),
            );
        };

        const leftOff = getOffset(Yg.EDGE_LEFT);
        const rightOff = getOffset(Yg.EDGE_RIGHT);
        const bottomOff = getOffset(Yg.EDGE_BOTTOM);
        const topOff = getOffset(Yg.EDGE_TOP);

        const offsetCorner: Point = {
            x: this.corner.x + leftOff,
            y: this.corner.y + topOff,
        };

        return {
            corner: offsetCorner,
            height: this.ygHeight - bottomOff - topOff,
            width: this.ygWidth - leftOff - rightOff,
        };
    }

    protected getVisRect() {
        return this.getClippedRect(this.unclippedRect);
    }

    protected getVisContentRect() {
        return this.getClippedRect(this.unclippedContentRect);
    }

    protected getClippedRect(unclipped: Rect): Rect {
        let { x, y } = unclipped.corner;
        let xDepth = x + unclipped.width;
        let yDepth = y + unclipped.height;

        x = this.clampNumToLimits(x, this.limits.minX, this.limits.maxX);
        y = this.clampNumToLimits(y, this.limits.minY, this.limits.maxY);
        xDepth = this.clampNumToLimits(xDepth, this.limits.minX, this.limits.maxX);
        yDepth = this.clampNumToLimits(yDepth, this.limits.minY, this.limits.maxY);

        return {
            corner: { x, y },
            height: yDepth - y,
            width: xDepth - x,
        };
    }

    protected clampNumToLimits(num: number, min: number, max: number): number {
        if (num < min) return min;
        if (num > max) return max;
        return num;
    }

    protected forceGridToAccomodate() {
        const currDepth = this.grid.length;
        const requestedDepth = Math.min(this.corner.y + this.ygHeight, this.limits.maxY);
        const rowsNeeded = requestedDepth - currDepth;

        for (let i = 0; i < rowsNeeded; ++i) {
            this.requestNewRow();
        }
    }

    protected requestNewRow() {
        if (this.grid.length < this.limits.maxY) {
            this.grid.push(
                Array.from({ length: this.stdout.columns }).fill(" ") as string[],
            );
        }
    }

    protected hasHiddenXOverflow(elem: DomElement): boolean {
        return (
            elem._shadowStyle.overflowX === "hidden" ||
            elem._shadowStyle.overflowX === "scroll"
        );
    }

    protected hasHiddenYOverflow(elem: DomElement): boolean {
        return (
            elem._shadowStyle.overflowY === "hidden" ||
            elem._shadowStyle.overflowY === "scroll"
        );
    }

    // ----Public Interface----

    public getDomRect(): DOMRect {
        const vis = this.visRect;
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

    public getPen(): Pen {
        return new Pen({
            grid: this.grid,
            canvas: this,
        });
    }

    public canDraw() {
        return this.visRect.height > 0 && this.visRect.width > 0;
    }

    public bindContext(grid: Grid, stdout: Stdout) {
        this.grid = grid;
        this.stdout = stdout;
        this.forceGridToAccomodate();
    }

    public static stringifyRowSegment(
        grid: Grid,
        y: number,
        start?: number,
        end?: number,
    ): string {
        return stringifyRowSegment(grid, y, start, end);
    }

    public static stringifyRow(grid: Grid, y: number): string {
        return stringifyRowSegment(grid, y);
    }

    public static stringifyGrid(grid: Grid): { newLines: number; output: string } {
        let newLines = 0;
        const output = grid
            .map((_row, y) => {
                const nl = y === grid.length - 1 ? "" : "\n";
                if (nl) ++newLines;

                // prettier-ignore
                return Canvas
                    .stringifyRow(grid, y)
                    .trimEnd() + nl;
            })
            .join("");

        return { newLines, output };
    }
}

export class RootCanvas extends Canvas {
    public override readonly host: Root;
    public override readonly ygHeight: number;
    public override readonly ygWidth: number;
    public override readonly grid: Grid;
    public override readonly limits: Limits;
    public override readonly corner: Point;
    public override readonly stdout: Stdout;

    constructor(host: Root, stdout: Stdout) {
        super();
        this.host = host;
        this.stdout = stdout;
        this.grid = [];
        this.corner = { x: 0, y: 0 };

        const maxHeight = host.runtime.stdout.rows;
        const maxWidth = host.runtime.stdout.columns;

        this.ygHeight = maxHeight;
        this.ygWidth = maxWidth;
        this.limits = {
            minX: 0,
            minY: 0,
            maxX: maxWidth,
            maxY: maxHeight,
        };
    }
}

export class SubCanvas extends Canvas {
    public override readonly host: DomElement;
    public override grid: Grid;
    public override stdout: Stdout;
    // set in constrainToLayout
    public override corner!: Point;
    public override limits!: Limits;
    public override ygHeight!: number;
    public override ygWidth!: number;

    constructor(host: DomElement, parent: Canvas) {
        super();
        this.host = host;
        this.grid = parent.grid;
        this.stdout = parent.stdout;
        this.constrainToLayout(parent);
    }

    public constrainToLayout(parent: Canvas) {
        this.resetRects();
        this.ygHeight = this.getYgHeight();
        this.ygWidth = this.getYgWidth();
        this.corner = this.getCorner(parent);
        this.limits = this.getLimits(parent);
    }

    private getYgHeight() {
        return this.host._is(TEXT_ELEMENT)
            ? this.host._textHeight
            : this.host._node.getComputedHeight();
    }

    private getYgWidth() {
        return this.host._is(TEXT_ELEMENT)
            ? Math.max(this.host.textContent.length, this.host._node.getComputedWidth())
            : this.host._node.getComputedWidth();
    }

    private getCorner(parent: Canvas) {
        const ygXoff = this.host._node.getComputedLeft();
        const ygYoff = this.host._node.getComputedTop();

        const pscrollX = parent.host._scrollOffset.x;
        const pscrollY = parent.host._scrollOffset.y;

        return {
            x: parent.corner.x + ygXoff + pscrollX,
            y: parent.corner.y + ygYoff + pscrollY,
        };
    }

    private getLimits(parent: Canvas) {
        const limits = { ...parent.limits };
        const pHost = parent.host;
        const xOverFlow = this.hasHiddenXOverflow(pHost);
        const yOverflow = this.hasHiddenYOverflow(pHost);

        if (xOverFlow || yOverflow) {
            const pVis = parent.visContentRect;
            if (xOverFlow) {
                limits.minX = pVis.corner.x;
                limits.maxX = pVis.corner.x + pVis.width;
            }
            if (yOverflow) {
                limits.minY = pVis.corner.y;
                limits.maxY = pVis.corner.y + pVis.height;
            }
        }

        return limits;
    }
}
