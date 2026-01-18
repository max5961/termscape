import { FOCUS_MANAGER } from "../Constants.js";
import type { Style } from "./style/Style.js";
import { recalculateStyle } from "./util/recalculateStyle.js";
import type { VisualNodeMap } from "../Types.js";
import { DomElement } from "./DomElement.js";
import type { Props } from "./props/Props.js";
import type { Rect } from "../compositor/Canvas.js";

type FMSchema = {
    Style: Style.FocusManager;
    Props: Props.FocusManager;
};

export abstract class FocusManager<
    Schema extends FMSchema = FMSchema,
> extends DomElement<Schema> {
    protected static override identity = FOCUS_MANAGER;

    private static RecalulateFlexShrink = (child: DomElement) => {
        recalculateStyle(child, "flexShrink");
    };

    private vmap: VisualNodeMap;
    protected _focused: DomElement | undefined;

    constructor() {
        super();
        this.vmap = new Map();
        this._focused = undefined;
        this._lastOffsetChangeWasFocus = true;

        this.registerPropEffect("blockChildrenShrink", () => {
            this._children.forEach((child) => {
                recalculateStyle(child, "flexShrink");
            });
        });
    }

    protected abstract getNavigableChildren(): DomElement[];
    protected abstract handleAppendChild(child: DomElement): void;
    // prettier-ignore
    protected abstract handleRemoveChild(child: DomElement, freeRecursive?: boolean): void;
    protected abstract buildVisualMap(children: DomElement[], vmap: VisualNodeMap): void;

    // CHORE - We could write a decorator for this

    public override appendChild(child: DomElement): void {
        super.appendChild(child);
        this.handleAppendChild(child);

        FocusManager.RecalulateFlexShrink(child);
    }

    public override insertBefore(child: DomElement, beforeChild: DomElement): void {
        super.insertBefore(child, beforeChild);
        this.handleAppendChild(child);

        FocusManager.RecalulateFlexShrink(child);
    }

    public override removeChild(child: DomElement, freeRecursive?: boolean): void {
        this.handleRemoveChild(child, freeRecursive);
        super.removeChild(child, freeRecursive);

        if (this._focused === child) {
            const data = this.getFocusedData();
            const next = data?.up || data?.down || data?.left || data?.right;
            this.focusChild(next);
        }

        FocusManager.RecalulateFlexShrink(child);
    }

    public get focused() {
        return this._focused;
    }

    protected get visualMap(): Readonly<VisualNodeMap> {
        return this.vmap;
    }

    // CHORE - Can we delegate more responsibility to FocusNode for this?
    public focusChild(child: DomElement | undefined): DomElement | undefined {
        if (!child || this._focused === child) return;
        if (!this.vmap.has(child)) return;

        const prev = this._focused ? this.vmap.get(this._focused) : undefined;
        const next = this.vmap.get(child);

        this._focused?._setOwnProvider(false);
        this._focused = child;
        this._focused?._setOwnProvider(true);

        const prevX = prev?.xIdx ?? 0;
        const prevY = prev?.yIdx ?? 0;
        const nextX = next?.xIdx ?? 0;
        const nextY = next?.yIdx ?? 0;
        const dx = nextX - prevX;
        const dy = nextY - prevY;

        this.normalizeScrollToFocus(
            dx < 0 ? "left" : dx > 0 ? "right" : dy < 0 ? "up" : "down",
        );

        return this._focused;
    }

    private getWindowRect() {
        return this._canvas?.unclippedContentRect;
    }

    private getFocusItemRect() {
        return this._focused?.unclippedRect;
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

    private getVertScrollOff(windowRect: Rect, windowBot: number) {
        return this._getAnyProp("keepFocusedCenter")
            ? Math.floor(windowRect.height / 2)
            : Math.min(this._getAnyProp("scrollOff") ?? 0, windowBot);
    }

    private getHorizScrollOff(windowRect: Rect, windowRight: number) {
        return this._getAnyProp("keepFocusedCenter")
            ? Math.floor(windowRect.width / 2)
            : Math.min(this._getAnyProp("scrollOff") ?? 0, windowRight);
    }

    protected getVertVisibility(
        windowRect: Rect,
        focusRect: Rect,
        dir: -1 | 1 = 1,
        useScrollOff = false,
    ): { above: number; below: number } {
        const { wTop, fTop, wBot, fBot } = this.getTopBottom(windowRect, focusRect);
        const scrollOff = useScrollOff ? this.getVertScrollOff(windowRect, wBot) : 0;

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

    protected getHorizVisibility(
        windowRect: Rect,
        focusRect: Rect,
        dir: -1 | 1 = 1,
        useScrollOff = false,
    ): { left: number; right: number } {
        const { wLeft, fLeft, wRight, fRight } = this.getLeftRight(windowRect, focusRect);
        const scrollOff = useScrollOff ? this.getHorizScrollOff(windowRect, wRight) : 0;

        const itemLeftWin = fLeft < wLeft + scrollOff;
        const itemRightWin = fRight > wRight - scrollOff;

        const left = wLeft + scrollOff - fLeft;
        const right = fRight - wRight + scrollOff;

        if (itemLeftWin || itemRightWin) {
            return dir > 0 ? { left, right: 0 } : { right, left: 0 };
        }
        return { left: 0, right: 0 };
    }

    /**
     * @internal
     * Adjust the `_scrollOffset` in order to keep the focused element in view
     */
    public normalizeScrollToFocus(
        d: "up" | "down" | "left" | "right",
        triggerRender = true,
    ) {
        if (!this._focused) return;
        if (!this._getAnyProp("keepFocusedVisible")) return;

        const isVertScroll = d === "down" || d === "up";
        const isNegScroll =
            d === "down" || d === "left" || this._getAnyProp("keepFocusedCenter");

        const fRect = this.getFocusItemRect();
        const wRect = this.getWindowRect();
        if (!fRect || !wRect) return;

        // If focus item is too large for window, pin to top or left
        if (isVertScroll && fRect.height >= wRect.height) {
            const toScroll = fRect.corner.y - wRect.corner.y;
            if (toScroll > 0) this._scrollDownWithFocus(toScroll, triggerRender);
            else this._scrollUpWithFocus(Math.abs(toScroll), triggerRender);
            return;
        }
        if (!isVertScroll && fRect.width >= wRect.width) {
            const toScroll = fRect.corner.x - wRect.corner.x;
            if (toScroll > 0) this._scrollRightWithFocus(toScroll, triggerRender);
            else this._scrollLeftWithFocus(Math.abs(toScroll), triggerRender);
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
                this._scrollUpWithFocus(above, triggerRender);
            } else if (below) {
                this._scrollDownWithFocus(below, triggerRender);
            }
        } else {
            const { left, right } = this.getHorizVisibility(
                wRect,
                fRect,
                isNegScroll ? -1 : 1,
                true,
            );

            if (left) {
                this._scrollLeftWithFocus(left, triggerRender);
            } else if (right) {
                this._scrollRightWithFocus(right, triggerRender);
            }
        }
    }

    /**
     * @internal
     *
     * Handle layout changes or first renders that have pushed the focused item
     * out of visibility, and subsequently adjust the corner offset **without**
     * causing a re-render since this will be handled during compositing.
     *
     * @returns `true` if the corner offset was adjusted
     * */
    public _adjustOffsetToFocus(): boolean {
        // Allow for non-focus scrolling to occur and obscure the focused child
        if (!this._lastOffsetChangeWasFocus) return false;
        if (!this._getAnyProp("keepFocusedVisible")) return false;

        const windowRect = this.getWindowRect();
        const focusRect = this.getFocusItemRect();
        if (!windowRect || !focusRect) return false;

        const { above, below } = this.getVertVisibility(windowRect, focusRect);
        const { left, right } = this.getHorizVisibility(windowRect, focusRect);

        // Focused item is visible - no need to adjust corner offset
        if (!above && !below && !left && !right) {
            return false;
        }

        if (above || below) this.normalizeScrollToFocus("up", false);
        if (left || right) this.normalizeScrollToFocus("left", false);
        return true;
    }

    private displaceFocus(dx: number, dy: number): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;
        if (!dx && !dy) return;

        const applyDisplacement = (d: number, idx?: number, arr?: DomElement[]) => {
            if (!arr || idx === undefined) return;

            let next = idx + d;

            if (this._getAnyProp("fallthrough")) {
                if (next < 0) {
                    next = arr.length - 1;
                } else if (next > arr.length - 1) {
                    next = 0;
                }
            }

            if (d < 0) {
                next = Math.max(0, next);
            } else {
                next = Math.min(arr.length - 1, next);
            }

            this.focusChild(arr[next]);
            return arr[next];
        };

        const result = dx
            ? applyDisplacement(dx, data.xIdx, data.xArr)
            : applyDisplacement(dy, data.yIdx, data.yArr);

        return result;
    }

    /** @internal */
    public _refreshVisualMap() {
        const children = this.getNavigableChildren();
        this.vmap = new Map();
        this.buildVisualMap(children, this.vmap);
    }

    protected getFocusedData() {
        if (!this._focused) return;
        return this.vmap.get(this._focused);
    }

    private getYArr() {
        return this.getFocusedData()?.yArr;
    }

    private getXArr() {
        return this.getFocusedData()?.xArr;
    }

    protected focusDown(): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;
        if (data.down) {
            return this.focusChild(data.down);
        }
    }
    protected focusUp(): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;
        if (data.up) {
            return this.focusChild(data.up);
        }
    }
    protected focusLeft(): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;
        if (data.left) {
            return this.focusChild(data.left);
        }
    }
    protected focusRight(): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;
        if (data.right) {
            return this.focusChild(data.right);
        }
    }
    protected displaceDown(n = 1): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;

        return this.displaceFocus(0, Math.abs(n));
    }
    protected displaceUp(n = 1): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;

        return this.displaceFocus(0, -Math.abs(n));
    }
    protected displaceLeft(n = 1): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;

        return this.displaceFocus(-Math.abs(n), 0);
    }
    protected displaceRight(n = 1): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;

        return this.displaceFocus(Math.abs(n), 0);
    }
    protected focusXIdx(nextIdx: number): DomElement | undefined {
        const xArr = this.getXArr();
        if (!xArr || !xArr[nextIdx]) return;

        const prevIdx = this.getFocusedData()?.xIdx ?? 0;
        const displacement = nextIdx - prevIdx;

        return this.displaceFocus(displacement, 0);
    }
    protected focusYIdx(nextIdx: number): DomElement | undefined {
        const yArr = this.getYArr();
        if (!yArr || !yArr[nextIdx]) return;

        const prevIdx = this.getFocusedData()?.yIdx ?? 0;
        const displacement = nextIdx - prevIdx;

        return this.displaceFocus(0, displacement);
    }
    protected focusFirstX(): DomElement | undefined {
        const xArr = this.getXArr();
        if (!xArr || !xArr[0]) return;

        return this.focusChild(xArr[0]);
    }
    protected focusFirstY(): DomElement | undefined {
        const yArr = this.getYArr();
        if (!yArr || !yArr[0]) return;

        return this.focusChild(yArr[0]);
    }
    protected focusLastX(): DomElement | undefined {
        const xArr = this.getXArr();
        if (!xArr || !xArr.length) return;

        return this.focusChild(xArr[xArr.length - 1]);
    }
    protected focusLastY(): DomElement | undefined {
        const yArr = this.getYArr();
        if (!yArr || !yArr.length) return;

        return this.focusChild(yArr[yArr.length - 1]);
    }
}
