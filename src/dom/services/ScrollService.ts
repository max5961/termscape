import type { Point } from "../../Types.js";
import type { DomElement } from "../DomElement.js";

export interface IScrollService {
    scrollUp(units?: number): void;
    scrollDown(units?: number): void;
    scrollLeft(units?: number): void;
    scrollRight(units?: number): void;
}

type ContentRange = {
    high: number;
    low: number;
    left: number;
    right: number;
};

export class ScrollService implements IScrollService {
    private host: DomElement;
    private _contentRange!: ContentRange;
    public get contentRange(): Readonly<ContentRange> {
        return this._contentRange;
    }

    private _scrollOffset: Point;
    public get scrollOffset(): Readonly<Point> {
        return this._scrollOffset;
    }

    private _lastOffsetChangeWasFocus: boolean;
    public get lastOffsetChangeWasFocus() {
        return this._lastOffsetChangeWasFocus;
    }

    constructor(host: DomElement) {
        this.host = host;
        this._scrollOffset = { x: 0, y: 0 };
        this.resetContentRange();
        this._lastOffsetChangeWasFocus = false;
    }

    public resetContentRange() {
        this._contentRange = {
            low: -Infinity,
            high: Infinity,
            left: Infinity,
            right: -Infinity,
        };
    }

    // TODO - does high mean deepest (high number value) or high visually (low number value)

    public get highestContent() {
        return this._contentRange.high;
    }
    public get deepestContent() {
        return this._contentRange.low;
    }
    public get leftestContent() {
        return this._contentRange.left;
    }
    public get rightestContent() {
        return this._contentRange.right;
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

    // There **WAS** a triggerRender optional param here.  This was used during
    // FocusManager code...but unsure why
    /**
     * Triggers a render *if* the requested scroll amount is greater than 0
     * */
    private applyScroll(dx: number, dy: number) {
        const allowedUnits = this.requestScroll(dx, dy);

        if (allowedUnits) {
            if (dy) {
                this.applyCornerOffset(0, allowedUnits);
            } else if (dx) {
                this.applyCornerOffset(allowedUnits, 0);
            }

            this.host._metadata.getRoot()?.scheduleRender({ layoutChange: true });
        }
    }

    /**
     * Does **NOT** trigger a render
     * */
    private applyCornerOffset(dx: number, dy: number) {
        this._scrollOffset.x += dx;
        this._scrollOffset.y += dy;
    }

    // CHORE (possibly) - is it possible to make it so that we only need to remember
    // that negative offsets scroll up/left only here?
    /**
     * A negative dy scrolls *down* by "pulling" content *up*.
     * A negative dx scrolls *right* by "pulling" content *left*
     * */
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
            const lowest = this._contentRange.low;
            const highest = this._contentRange.high;

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
            const mostRight = this._contentRange.right;
            const mostLeft = this._contentRange.left;

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

        this._contentRange.high = Math.min(
            this._contentRange.high,
            unclippedChild.corner.y,
        );
        this._contentRange.low = Math.max(
            this._contentRange.low,
            unclippedChild.corner.y + unclippedChild.height,
        );
        this._contentRange.left = Math.min(
            this._contentRange.left,
            unclippedChild.corner.x,
        );
        this._contentRange.right = Math.max(
            this._contentRange.right,
            unclippedChild.corner.x + unclippedChild.width,
        );
    }

    public getScrollData(): { x: number; y: number } {
        const rect = this.host.unclippedContentRect;
        const result = { x: 0, y: 0 };
        if (!rect) return result;

        const lowest = this._contentRange.low;
        const highest = this._contentRange.high;
        const currentY = rect.corner.y - highest;
        const possibleY = Math.abs(this.requestScroll(0, -Infinity));

        if (highest >= rect.corner.y) {
            result.y = 0;
        } else if (lowest <= rect.corner.y + rect.height) {
            result.y = 100;
        } else {
            result.y = Math.floor((currentY / (currentY + possibleY)) * 100);
        }

        const mostLeft = this._contentRange.left;
        const mostRight = this._contentRange.right;
        const currentX = rect.corner.x - mostLeft;
        const possibleX = Math.abs(this.requestScroll(-Infinity, 0));

        if (mostLeft >= rect.corner.x) {
            result.x = 0;
        } else if (mostRight <= rect.corner.x + rect.width) {
            result.x = 100;
        } else {
            result.x = Math.floor((currentX / (currentX + possibleX)) * 100);
        }

        return result;
    }

    /**
     * After resizes, corner offset might be unoptimized.
     *
     * @returns `true` if any adjustments were made
     * */
    public adjustScrollToFillContainer(): boolean {
        const highest = this._contentRange.high;
        const lowest = this._contentRange.low;
        const leftest = this._contentRange.left;
        const rightest = this._contentRange.right;

        const rect = this.host.unclippedContentRect;
        if (!rect) return false;

        const lowestVis = rect.corner.y + rect.height;
        const highestVis = rect.corner.y;
        const leftestVis = rect.corner.x;
        const rightestVis = rect.corner.x + rect.width;

        const fitsHeight = lowest - highest <= rect.height;
        const fitsWidth = rightest - leftest <= rect.width;

        let dy = 0;
        let dx = 0;

        if (!fitsHeight) {
            if (highest > highestVis) {
                // need to scroll DOWN (-dy)
                dy = highestVis - highest;
            } else if (lowest < lowestVis) {
                // need to scroll UP (+dy)
                dy = lowestVis - lowest;
            }
        }
        if (!fitsWidth) {
            if (leftest > leftestVis) {
                dx = leftestVis - leftest;
            } else if (rightest < rightestVis) {
                dx = rightestVis - rightest;
            }
        }

        if (!dx && !dy) return false;

        this.applyCornerOffset(dx, dy);
        return true;
    }
}
