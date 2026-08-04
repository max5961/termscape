import type { Point } from "../../Types.js";
import type { DomElement } from "../DomElement.js";

type ContentRange = {
    high: number;
    low: number;
    left: number;
    right: number;
};

export class ScrollManager {
    private host: DomElement;
    private scrollOffset: Point;
    private contentRange: ContentRange;
    private _lastOffsetChangeWasFocus: boolean;
    public get lastOffsetChangeWasFocus() {
        return this._lastOffsetChangeWasFocus;
    }

    constructor(host: DomElement) {
        this.host = host;
        this.scrollOffset = { x: 0, y: 0 };
        this.contentRange = {
            high: Infinity,
            low: -Infinity,
            left: Infinity,
            right: -Infinity,
        };
        this._lastOffsetChangeWasFocus = false;
    }

    public scrollDown(units: number, focus = false) {
        this._lastOffsetChangeWasFocus = focus;
        this.applyScroll(0, -units);
    }

    public scrollUp(units: number, focus = false) {
        this._lastOffsetChangeWasFocus = focus;
        this.applyScroll(0, units);
    }

    public scrollLeft(units: number, focus = false) {
        this._lastOffsetChangeWasFocus = focus;
        this.applyScroll(units, 0);
    }

    public scrollRight(units: number, focus = false) {
        this._lastOffsetChangeWasFocus = focus;
        this.applyScroll(-units, 0);
    }

    private applyScroll(dx: number, dy: number) {
        const allowedUnits = this.requestScroll(dx, dy);

        if (allowedUnits) {
            if (dy) {
                this.applyCornerOffset(0, allowedUnits);
            } else if (dx) {
                this.applyCornerOffset(allowedUnits, 0);
            }
        }
    }

    private applyCornerOffset(dx: number, dy: number) {
        this.scrollOffset.x += dx;
        this.scrollOffset.y += dy;
    }

    private requestScroll(dx: number, dy: number) {
        if (!this.host._canvas) return 0;

        // Corner offsets **MUST** be whole numbers.  When drawing to the Canvas,
        // if the computed rects are floats, then nothing will be drawn since
        // you can't index a point on a grid with a float.
        dx = dx > 0 ? Math.floor(dx) : Math.ceil(dx);
        dy = dy > 0 ? Math.floor(dy) : Math.ceil(dy);

        const contentRect = this.host._canvas.unclippedContentRect;
        const contentDepth = contentRect.corner.y + contentRect.height;
        const contentWidth = contentRect.corner.x + contentRect.width;

        if (dy) {
            const lowest = this.host._contentRange.low;
            const highest = this.host._contentRange.high;

            // Pulling content up - scrolling down
            if (dy < 0) {
                if (contentDepth >= lowest) return 0;
                return Math.max(dy, contentDepth - lowest);

                // Pushing content down - scrolling up
            } else {
                if (contentRect.corner.y <= highest) return 0;
                return Math.min(dy, contentRect.corner.y - highest);
            }
        }

        if (dx) {
            const mostRight = this.host._contentRange.right;
            const mostLeft = this.host._contentRange.left;

            // Pulling content left - scrolling right
            if (dx < 0) {
                if (contentWidth >= mostRight) return 0;
                return Math.max(dx, contentWidth - mostRight);

                // Pushing content right - scrolling left
            } else {
                if (contentRect.corner.x <= mostLeft) return 0;
                return Math.min(dx, contentRect.corner.x - mostLeft);
            }
        }

        return 0;
    }

    public updateContentRange(child: DomElement) {
        const unclippedChild = child.unclippedRect;
        if (!unclippedChild) return;

        this.contentRange.high = Math.min(
            this.contentRange.high,
            unclippedChild.corner.y,
        );
        this.contentRange.low = Math.max(
            this.contentRange.low,
            unclippedChild.corner.y + unclippedChild.height,
        );
        this.contentRange.left = Math.min(
            this.contentRange.left,
            unclippedChild.corner.x,
        );
        this.contentRange.right = Math.max(
            this.contentRange.right,
            unclippedChild.corner.x + unclippedChild.width,
        );
    }
}
