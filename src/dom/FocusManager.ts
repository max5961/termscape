import { FOCUS_MANAGER } from "../Constants.js";
import type { Style } from "./style/Style.js";
import { recalculateStyle } from "./util/recalculateStyle.js";
import type { VisualNodeMap } from "../Types.js";
import { DomElement } from "./DomElement.js";
import type { Props } from "./props/Props.js";

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
    private _focused: DomElement | undefined;

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

        if (this.focused === child) {
            const data = this.getFocusedData();
            const next = data?.up || data?.down || data?.left || data?.right;
            this.focusChild(next);
        }

        FocusManager.RecalulateFlexShrink(child);
    }

    public get focused() {
        return this._focused;
    }

    protected set focused(val: DomElement | undefined) {
        this._focused = val;
    }

    protected get visualMap(): Readonly<VisualNodeMap> {
        return this.vmap;
    }

    private getFMProp<T extends keyof Props.FocusManager>(
        prop: T,
    ): Props.FocusManager[T] {
        return this.getProp(prop);
    }

    public focusChild(child: DomElement | undefined): DomElement | undefined {
        if (!child || this.focused === child) return;
        if (!this.vmap.has(child)) return;

        const prev = this.focused ? this.vmap.get(this.focused) : undefined;
        const next = this.vmap.get(child);

        this.focused?._focusNode.updateCheckpoint(false);
        this.focused = child;
        this.focused._focusNode.updateCheckpoint(true);

        const prevX = prev?.xIdx ?? 0;
        const prevY = prev?.yIdx ?? 0;
        const nextX = next?.xIdx ?? 0;
        const nextY = next?.yIdx ?? 0;
        const dx = nextX - prevX;
        const dy = nextY - prevY;

        this.normalizeScrollToFocus(
            dx < 0 ? "left" : dx > 0 ? "right" : dy < 0 ? "up" : "down",
        );

        return this.focused;
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

        // If undefined, this means that no layout has been generated yet
        const visibility = this.focusedChildVisibilityStatus();
        if (!visibility) return false;

        const { itemBelowWin, itemAboveWin, itemRightWin, itemLeftWin } = visibility;

        // Focused item is visible - no need to adjust corner offset
        if (!itemBelowWin && !itemAboveWin && !itemRightWin && !itemLeftWin) {
            return false;
        }

        if (itemBelowWin || itemAboveWin) {
            this.normalizeScrollToFocus("up", false);
        }
        if (itemRightWin || itemLeftWin) {
            this.normalizeScrollToFocus("left", false);
        }

        return true;
    }

    /**
     * ----IMPORTANT-TODO----
     * THIS IS NOT PERFECT FOR CHECKING ITEM LEFT OR RIGHT OF WIN.  OFF BY ONE
     * ERROR
     * */
    private focusedChildVisibilityStatus() {
        const fRect = this.focused?.unclippedRect;
        const wRect = this.unclippedContentRect;

        if (!fRect || !wRect) return;

        const wTop = wRect.corner.y;
        const fTop = fRect.corner.y;
        const wBot = wRect.corner.y + wRect.height;
        const fBot = fRect.corner.y + fRect.height;

        const fLeft = fRect.corner.x;
        const wLeft = wRect.corner.x;
        const fRight = fRect.corner.x + fRect.width;
        const wRight = wRect.corner.x + wRect.width;

        let scrollOff = this.getFMProp("keepFocusedCenter")
            ? Math.floor(wRect.height / 2)
            : Math.min(this.getFMProp("scrollOff") ?? 0, wBot);

        if (this.style.flexDirection?.includes("row")) {
            scrollOff = this.getFMProp("keepFocusedCenter")
                ? Math.floor(wRect.width / 2)
                : Math.min(this.getFMProp("scrollOff") ?? 0, wBot);
        }

        const itemBelowWin = fBot > wBot - scrollOff;
        const itemAboveWin = fTop <= wTop + scrollOff;

        const itemRightWin = fRight > wRight - scrollOff;
        const itemLeftWin = fLeft <= wLeft + scrollOff;

        return {
            itemBelowWin,
            itemAboveWin,
            itemRightWin,
            itemLeftWin,
        };
    }

    /**
     * @internal
     *
     * Adjust the `_scrollOffset` in order to keep the focused element in view
     */
    public normalizeScrollToFocus(
        direction: "up" | "down" | "left" | "right",
        triggerRender = true,
    ) {
        if (!this.focused) return;
        if (!this.getFMProp("keepFocusedVisible")) return;

        const isScrollNegative = direction === "down" || direction === "left";
        const isLTR = direction === "left" || direction === "right";

        // Scroll Window Rect & Focus Item Rect
        const fRect = this.focused.unclippedRect;
        const wRect = this._canvas?.unclippedContentRect;
        if (!fRect || !wRect) return;

        if (!isLTR) {
            const wTop = wRect.corner.y;
            const fTop = fRect.corner.y;
            const wBot = wRect.corner.y + wRect.height;
            const fBot = fRect.corner.y + fRect.height;

            const scrollOff = this.getFMProp("keepFocusedCenter")
                ? Math.floor(wRect.height / 2)
                : Math.min(this.getFMProp("scrollOff") ?? 0, wBot);

            // If focus item is as large or larger than window, pin to top.
            if (fRect.height >= wRect.height) {
                const toScroll = fTop - wTop;
                if (toScroll > 0) {
                    this._scrollDownWithFocus(toScroll, triggerRender);
                } else {
                    this._scrollUpWithFocus(Math.abs(toScroll), triggerRender);
                }
                return;
            }

            const itemBelowWin = fBot > wBot - scrollOff;
            const itemAboveWin = fTop <= wTop + scrollOff;

            const scroll = () => {
                return isScrollNegative || this.getFMProp("keepFocusedCenter")
                    ? this._scrollDownWithFocus(fBot - wBot + scrollOff, triggerRender)
                    : this._scrollUpWithFocus(wTop + scrollOff - fTop, triggerRender);
            };

            if (itemBelowWin || itemAboveWin) {
                return scroll();
            }

            // `scroll` fn explanation
            // If `scrollOff` is greater than half the dimension of the window, then
            // the direction by which we are scrolling becomes important because the
            // scrollOff will cause the above/below variables to oscillate.  Checking
            // the direction forces the same behavior regardless.  In most other
            // cases the above/below variables align with `isScrollDown`.  If they
            // don't, such as when non-focus scroll is involved, either fn still
            // brings the focused item into the window.
        } else {
            const fLeft = fRect.corner.x;
            const wLeft = wRect.corner.x;
            const fRight = fRect.corner.x + fRect.width;
            const wRight = wRect.corner.x + wRect.width;

            if (fRect.width >= wRect.width) {
                const toScroll = fRight - wRight;
                if (toScroll > 0) {
                    this._scrollRightWithFocus(toScroll, triggerRender);
                } else {
                    this._scrollLeftWithFocus(Math.abs(toScroll), triggerRender);
                }
            }

            const scrollOff = this.getFMProp("keepFocusedCenter")
                ? Math.floor(wRect.width / 2)
                : Math.min(this.getFMProp("scrollOff") ?? 0, wRight);

            const itemRightWin = fRight > wRight - scrollOff;
            const itemLeftWin = fLeft <= wLeft + scrollOff;

            const scroll = () => {
                return isScrollNegative || this.getFMProp("keepFocusedCenter")
                    ? this._scrollRightWithFocus(
                          fRight - wRight + scrollOff,
                          triggerRender,
                      )
                    : this._scrollLeftWithFocus(wLeft + scrollOff - fLeft, triggerRender);
            };

            if (itemRightWin || itemLeftWin) {
                return scroll();
            }
        }
    }

    public refreshVisualMap() {
        const children = this.getNavigableChildren();
        this.vmap = new Map();
        this.buildVisualMap(children, this.vmap);
    }

    protected getFocusedData() {
        if (!this.focused) return;
        return this.vmap.get(this.focused);
    }

    private getYArr() {
        return this.getFocusedData()?.yArr;
    }

    private getXArr() {
        return this.getFocusedData()?.xArr;
    }

    private displaceFocus(dx: number, dy: number): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;
        if (!dx && !dy) return;

        const applyDisplacement = (d: number, idx?: number, arr?: DomElement[]) => {
            if (!arr || idx === undefined) return;

            let next = idx + d;

            if (this.getFMProp("fallthrough")) {
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
