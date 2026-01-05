import { TEXT_ELEMENT, Yg } from "../Constants.js";
import type { DomElement } from "../dom/DomElement.js";
import type { Root } from "../dom/RootElement.js";
import { stringifyRowSegment } from "../shared/StringifyGrid.js";
import type { DOMRect, Edge, GridToken, Point } from "../Types.js";

export type Grid = (string | GridToken)[][];

type Rect = {
    corner: Point;
    height: number;
    width: number;
};

type Limits = {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
};

export abstract class Canvas {
    public abstract readonly host: DomElement;
    public abstract readonly corner: Point;
    public abstract readonly grid: Grid;
    public abstract limits: Limits;
    public abstract ygHeight: number;
    public abstract ygWidth: number;

    private _unclippedRect: Rect | undefined = undefined;
    public get unclippedRect() {
        this._unclippedRect ??= this.getUnclippedRect();
        return this._unclippedRect;
    }

    private _unclippedContentRect: Rect | undefined = undefined;
    public get unclippedContentRect() {
        this._unclippedContentRect ??= this.getUnclippedContentRect();
        return this._unclippedContentRect;
    }

    private _visRect: Rect | undefined = undefined;
    public get visRect() {
        this._visRect ??= this.getVisRect();
        return this._visRect;
    }

    private _visContentRect: Rect | undefined = undefined;
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

    private getUnclippedRect(): Rect {
        return {
            corner: { ...this.corner },
            width: this.ygWidth,
            height: this.ygHeight,
        };
    }

    private getUnclippedContentRect(): Rect {
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

    private getVisRect() {
        return this.getClippedRect(this.unclippedRect);
    }

    private getVisContentRect() {
        return this.getClippedRect(this.unclippedContentRect);
    }

    private getClippedRect(unclipped: Rect): Rect {
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

    public getPen() {
        // return new Pen({
        //     grid: this.grid,
        //     canvas: this,
        // });
    }

    public stringifyRowSegment(y: number, start?: number, end?: number): string {
        return stringifyRowSegment(this.grid, y, start, end);
    }

    public stringifyRow(y: number): string {
        return stringifyRowSegment(this.grid, y);
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

    public canDraw() {
        return this.visRect.height > 0 && this.visRect.width > 0;
    }
}

export class RootCanvas extends Canvas {
    public override host: Root;
    public override ygHeight: number;
    public override ygWidth: number;
    public override readonly grid: Grid;
    public override readonly limits: Limits;
    public override readonly corner: Point;

    constructor(host: Root) {
        super();
        this.host = host;
        this.grid = [];
        this.corner = { x: 0, y: 0 };
        this.ygHeight = host.runtime.stdout.rows;
        this.ygWidth = host.runtime.stdout.columns;
        this.limits = {
            minX: 0,
            minY: 0,
            maxX: this.ygWidth,
            maxY: this.ygHeight,
        };
    }
}

/**
 * ygHeight and ygWidth represent dimensions in the context of yoga
 *
 * limits represent the maximum or minimum drawable area.  Even though none of
 * the elements intentionally draw outside of their ygHeight and ygWidth, there is
 * nothing stopping child elements from doing so if the limits are not constrained
 * */

export class SubCanvas extends Canvas {
    public override readonly host: DomElement;
    public override readonly grid: Grid;
    // set in constrainSelf
    public override corner!: Point;
    public override limits!: Limits;
    public override ygHeight!: number;
    public override ygWidth!: number;

    constructor(host: DomElement, parent: Canvas) {
        super();
        this.host = host;
        this.grid = parent.grid;
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

    private hasHiddenXOverflow(elem: DomElement): boolean {
        return (
            elem._shadowStyle.overflowX === "hidden" ||
            elem._shadowStyle.overflowX === "scroll"
        );
    }

    private hasHiddenYOverflow(elem: DomElement): boolean {
        return (
            elem._shadowStyle.overflowY === "hidden" ||
            elem._shadowStyle.overflowY === "scroll"
        );
    }
}
