import type { Rect } from "../../../compositor/Canvas.js";
import { logger } from "../../../shared/Logger.js";
import type { DomElement } from "../../DomElement.js";

export class FocusScrollerService {
    private host: DomElement;
    // private focused: DomElement | undefined;
    private get focused(): DomElement | undefined {
        // @ts-ignore LOL
        return this.host._focusService.focused;
    }

    constructor(host: DomElement) {
        this.host = host;
    }

    public scrollToFitFocus(d: "up" | "down" | "left" | "right") {
        const isVertScroll = d === "down" || d === "up";
        const isNegScroll =
            d === "down" || d === "left" || this.host._getAnyProp("keepFocusedCenter");

        const fRect = this.getFocusItemRect();
        const wRect = this.getWindowRect();
        if (!fRect || !wRect) return;

        // If focus item is too large for window, pin to top or left
        if (isVertScroll && fRect.height >= wRect.height) {
            const toScroll = fRect.corner.y - wRect.corner.y;
            if (toScroll > 0) this.focusScrollDown(toScroll);
            else this.focusScrollUp(Math.abs(toScroll));
            return;
        }
        if (!isVertScroll && fRect.width >= wRect.width) {
            const toScroll = fRect.corner.x - wRect.corner.x;
            if (toScroll > 0) this.focusScrollRight(toScroll);
            else this.focusScrollLeft(Math.abs(toScroll));
            return;
        }

        if (isVertScroll) {
            const { above, below } = this.getVertVisibility(
                wRect,
                fRect,
                isNegScroll ? -1 : 1,
                true,
            );

            if (above) {
                this.focusScrollUp(above);
            } else if (below) {
                this.focusScrollDown(below);
            }
        } else {
            const { left, right } = this.getHorizVisibility(
                wRect,
                fRect,
                isNegScroll ? -1 : 1,
                true,
            );

            if (left) {
                this.focusScrollLeft(left);
            } else if (right) {
                this.focusScrollRight(right);
            }
        }
    }

    /**
     * Handle layout changes or first renders that have pushed the focused item
     * out of visibility, and subsequently adjust the corner offset **without**
     * causing a re-render since this will be handled during compositing.
     *
     * @returns `true` if the corner offset was adjusted
     * */
    public adjustOffsetToFocus(): boolean {
        if (!this.focused) return false;

        // Allow for non-focus scrolling to occur and obscure the focused child
        if (!this.host._scrollService.lastOffsetChangeWasFocus) return false;
        if (!this.host._getAnyProp("keepFocusedVisible")) return false;

        const windowRect = this.getWindowRect();
        const focusRect = this.getFocusItemRect();
        if (!windowRect || !focusRect) return false;

        const { above, below } = this.getVertVisibility(windowRect, focusRect);
        const { left, right } = this.getHorizVisibility(windowRect, focusRect);

        // Focused item is visible - no need to adjust corner offset
        if (!above && !below && !left && !right) {
            return false;
        }

        if (above || below) this.scrollToFitFocus("up");
        if (left || right) this.scrollToFitFocus("left");
        return true;
    }

    private getVertVisibility(
        windowRect: Rect,
        focusRect: Rect,
        dir: -1 | 1 = 1,
        useScrollOff = false,
    ): { above: number; below: number } {
        const { wTop, fTop, wBot, fBot } = this.getTopBottom(windowRect, focusRect);
        const scrollOff = useScrollOff ? this.getVertScrollOff(windowRect) : 0;

        const itemAboveWin = fTop < wTop + scrollOff;
        const itemBelowWin = fBot > wBot - scrollOff;

        const above = wTop + scrollOff - fTop;
        const below = fBot - wBot + scrollOff;

        if (itemAboveWin || itemBelowWin) {
            // Conditionally flipping based dir maintains symmetry when scrollOff is present
            return dir > 0 ? { above, below: 0 } : { below, above: 0 };
        }
        return { above: 0, below: 0 };
    }

    private getHorizVisibility(
        windowRect: Rect,
        focusRect: Rect,
        dir: -1 | 1 = 1,
        useScrollOff = false,
    ): { left: number; right: number } {
        const { wLeft, fLeft, wRight, fRight } = this.getLeftRight(windowRect, focusRect);
        const scrollOff = useScrollOff ? this.getHorizScrollOff(windowRect) : 0;

        const itemLeftWin = fLeft < wLeft + scrollOff;
        const itemRightWin = fRight > wRight - scrollOff;

        const left = wLeft + scrollOff - fLeft;
        const right = fRight - wRight + scrollOff;

        if (itemLeftWin || itemRightWin) {
            return dir > 0 ? { left, right: 0 } : { right, left: 0 };
        }
        return { left: 0, right: 0 };
    }

    private getTopBottom(windowRect: Rect, focusRect: Rect) {
        return {
            wTop: windowRect.corner.y,
            fTop: focusRect.corner.y,
            wBot: windowRect.corner.y + windowRect.height,
            fBot: focusRect.corner.y + focusRect.height,
        };
    }

    private getLeftRight(windowRect: Rect, focusRect: Rect) {
        return {
            fLeft: focusRect.corner.x,
            wLeft: windowRect.corner.x,
            fRight: focusRect.corner.x + focusRect.width,
            wRight: windowRect.corner.x + windowRect.width,
        };
    }

    private getVertScrollOff(windowRect: Rect) {
        return this.host._getAnyProp("keepFocusedCenter")
            ? Math.floor(windowRect.height / 2)
            : Math.min(this.host._getAnyProp("scrollOff") ?? 0, windowRect.height - 1);
    }

    private getHorizScrollOff(windowRect: Rect) {
        return this.host._getAnyProp("keepFocusedCenter")
            ? Math.floor(windowRect.width / 2)
            : Math.min(this.host._getAnyProp("scrollOff") ?? 0, windowRect.width - 1);
    }

    private focusScrollDown(toScroll: number) {
        this.host._scrollService.scrollDown(toScroll, true);
    }
    private focusScrollUp(toScroll: number) {
        this.host._scrollService.scrollUp(toScroll, true);
    }
    private focusScrollLeft(toScroll: number) {
        this.host._scrollService.scrollLeft(toScroll, true);
    }
    private focusScrollRight(toScroll: number) {
        this.host._scrollService.scrollRight(toScroll, true);
    }
    private getFocusItemRect() {
        return this.focused?.unclippedRect;
    }
    private getWindowRect() {
        return this.host._canvas?.unclippedContentRect;
    }
}
