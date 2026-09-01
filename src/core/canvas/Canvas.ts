import { Yg } from "../../Constants.js";
import type { Edge, Point, StdoutLike } from "../../Types.js";
import type { CoreElement } from "../CoreElement.js";
import { Pen } from "./Pen.js";
import type { Grid, PenLimits, Rect } from "./types.js";

/**
 * Each Canvas corresponds to a DomElement and stores Rect and PenLimits data used
 * during compositing. Unclipped rects are based on the Yoga layout, whereas
 * clipped rects are dependent on the limits context from parent Canvases.
 *
 * Each Canvas contains a reference to the RootCanvas's 2d grid and can create a
 * Pen object, which safely draws only within its limits.  This allows the Draw
 * class to be free of any 'can I draw here' checks.
 *
 * PenLimits represent the maximum or minimum drawable area.  Even though none of
 * the elements intentionally draw outside of their ygHeight and ygWidth, there is
 * nothing stopping child elements from doing so if the limits are not constrained
 * */
export abstract class Canvas {
    public abstract readonly core: CoreElement;
    public abstract corner: Point;
    public abstract stdout: StdoutLike;
    public abstract grid: Grid;
    public abstract limits: PenLimits;
    public abstract ygHeight: number;
    public abstract ygWidth: number;
    private pen: Pen | undefined;

    public getPen() {
        if (this.pen) {
            this.pen.reset();
            return this.pen;
        }
        return new Pen(this);
    }

    private _unclippedRect?: Rect;
    public get unclippedRect() {
        this._unclippedRect ??= this.getUnclippedRect();
        return this._unclippedRect;
    }

    private _unclippedContentRect?: Rect;
    public get unclippedContentRect() {
        this._unclippedContentRect ??= this.getUnclippedContentRect();
        return this._unclippedContentRect;
    }

    private _visRect?: Rect;
    public get visRect() {
        this._visRect ??= this.getVisRect();
        return this._visRect;
    }

    private _visContentRect?: Rect;
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

    private getUnclippedRect() {
        return {
            corner: { ...this.corner },
            width: this.ygWidth,
            height: this.ygHeight,
        };
    }

    private getUnclippedContentRect() {
        const yogaNode = this.core.yogaNode;
        const getOffset = (edge: Edge) => {
            return Math.floor(
                yogaNode.getComputedBorder(edge) + yogaNode.getComputedPadding(edge),
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

    private getClippedRect(unclipped: Rect) {
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

    private clampNumToLimits(num: number, min: number, max: number): number {
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

    private requestNewRow() {
        if (this.grid.length < this.limits.maxY) {
            this.grid.push(
                Array.from({ length: this.stdout.columns }).fill(" ") as string[],
            );
        }
    }

    public canDraw() {
        return this.visRect.height > 0 && this.visRect.width > 0;
    }
}
