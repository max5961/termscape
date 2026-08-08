import type { VisualNodeMap } from "../../Types.js";
import type { DomElement } from "../DomElement.js";
import type { Rect } from "../../compositor/Canvas.js";

export interface IFocusController {
    _focusController: FocusController;
}

export abstract class FocusStrategy {
    public abstract getNavigableChildren(): DomElement[];
    public abstract buildVisualMap(children: DomElement[]): VisualNodeMap;
}

export class FocusController {
    private host: DomElement;
    private focused: DomElement | undefined;
    private visualMap: VisualNodeMap;
    private strategy: FocusStrategy;

    constructor(host: DomElement, strategy: FocusStrategy) {
        this.host = host;
        this.focused = undefined;
        this.visualMap = new Map();
        this.strategy = strategy;
    }

    public refreshVisualMap() {
        const children = this.strategy.getNavigableChildren();
        this.visualMap = this.strategy.buildVisualMap(children);
    }

    private displaceFocus(dx: number, dy: number): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;
        if (!dx && !dy) return;

        const applyDisplacement = (d: number, idx?: number, arr?: DomElement[]) => {
            if (!arr || idx === undefined) return;

            let next = idx + d;

            if (this.host._getAnyProp("fallthrough")) {
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

    public focusChild(child?: DomElement | undefined): DomElement | undefined {
        if (!child || !this.visualMap.has(child)) return;
        if (this.focused === child) return child;

        const prev = this.focused ? this.visualMap.get(this.focused) : undefined;
        const next = this.visualMap.get(child);

        this.setFocusToChild(child);

        const prevX = prev?.xIdx ?? 0;
        const prevY = prev?.yIdx ?? 0;
        const nextX = next?.xIdx ?? 0;
        const nextY = next?.yIdx ?? 0;
        const dx = nextX - prevX;
        const dy = nextY - prevY;

        this.scrollToFitFocus(
            dx < 0 ? "left" : dx > 0 ? "right" : dy < 0 ? "up" : "down",
        );

        return this.focused;
    }

    public scrollToFitFocus(d: "up" | "down" | "left" | "right") {
        if (!this.focused) return;
        if (!this.host._getAnyProp("keepFocusedVisible")) return;

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
    public getVertVisibility(
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

    public getHorizVisibility(
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
        this.host._scrollManager.scrollDown(toScroll, true);
    }
    private focusScrollUp(toScroll: number) {
        this.host._scrollManager.scrollUp(toScroll, true);
    }
    private focusScrollLeft(toScroll: number) {
        this.host._scrollManager.scrollLeft(toScroll, true);
    }
    private focusScrollRight(toScroll: number) {
        this.host._scrollManager.scrollRight(toScroll, true);
    }
    private setFocusToChild(child: DomElement) {
        this.focused?._focusNode.setOwnProvider(false);
        this.focused = child;
        child._focusNode.setOwnProvider(true);
    }
    private getFocusItemRect() {
        return this.focused?.unclippedRect;
    }
    private getWindowRect() {
        return this.host._canvas?.unclippedContentRect;
    }
    public getFocusedData() {
        if (!this.focused) return;
        return this.visualMap.get(this.focused);
    }

    private getYArr() {
        return this.getFocusedData()?.yArr;
    }

    private getXArr() {
        return this.getFocusedData()?.xArr;
    }

    public focusDown(): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;
        if (data.down) {
            return this.focusChild(data.down);
        }
    }
    public focusUp(): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;
        if (data.up) {
            return this.focusChild(data.up);
        }
    }
    public focusLeft(): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;
        if (data.left) {
            return this.focusChild(data.left);
        }
    }
    public focusRight(): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;
        if (data.right) {
            return this.focusChild(data.right);
        }
    }
    public displaceDown(n = 1): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;

        return this.displaceFocus(0, Math.abs(n));
    }
    public displaceUp(n = 1): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;

        return this.displaceFocus(0, -Math.abs(n));
    }
    public displaceLeft(n = 1): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;

        return this.displaceFocus(-Math.abs(n), 0);
    }
    public displaceRight(n = 1): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;

        return this.displaceFocus(Math.abs(n), 0);
    }
    public focusXIdx(nextIdx: number): DomElement | undefined {
        const xArr = this.getXArr();
        if (!xArr || !xArr[nextIdx]) return;

        const prevIdx = this.getFocusedData()?.xIdx ?? 0;
        const displacement = nextIdx - prevIdx;

        return this.displaceFocus(displacement, 0);
    }
    public focusYIdx(nextIdx: number): DomElement | undefined {
        const yArr = this.getYArr();
        if (!yArr || !yArr[nextIdx]) return;

        const prevIdx = this.getFocusedData()?.yIdx ?? 0;
        const displacement = nextIdx - prevIdx;

        return this.displaceFocus(0, displacement);
    }
    public focusFirstX(): DomElement | undefined {
        const xArr = this.getXArr();
        if (!xArr || !xArr[0]) return;

        return this.focusChild(xArr[0]);
    }
    public focusFirstY(): DomElement | undefined {
        const yArr = this.getYArr();
        if (!yArr || !yArr[0]) return;

        return this.focusChild(yArr[0]);
    }
    public focusLastX(): DomElement | undefined {
        const xArr = this.getXArr();
        if (!xArr || !xArr.length) return;

        return this.focusChild(xArr[xArr.length - 1]);
    }
    public focusLastY(): DomElement | undefined {
        const yArr = this.getYArr();
        if (!yArr || !yArr.length) return;

        return this.focusChild(yArr[yArr.length - 1]);
    }
}

// private setFocusToChild(child: DomElement) {
//     this.focused?._setOwnProvider(false);
//     this.focused = child;
//     this.focused?._setOwnProvider(true);
// }
//
// public focusChild(child: DomElement | undefined): DomElement | undefined {
//     if (!child || this.focused === child) return;
//     if (!this.visualMap.has(child)) return;
//
//     const prev = this.focused ? this.visualMap.get(this.focused) : undefined;
//     const next = this.visualMap.get(child);
//
//     this.setFocusToChild(child);
//
//     const prevX = prev?.xIdx ?? 0;
//     const prevY = prev?.yIdx ?? 0;
//     const nextX = next?.xIdx ?? 0;
//     const nextY = next?.yIdx ?? 0;
//     const dx = nextX - prevX;
//     const dy = nextY - prevY;
//
//     this.normalizeScrollToFocus(
//         dx < 0 ? "left" : dx > 0 ? "right" : dy < 0 ? "up" : "down",
//     );
//
//     return this.focused;
// }
//
// public getWindowRect() {
//     return this.host._canvas?.unclippedContentRect;
// }
//
// public getFocusItemRect() {
//     return this.focused?.unclippedRect;
// }
//
// private getTopBottom(windowRect: Rect, focusRect: Rect) {
//     return {
//         wTop: windowRect.corner.y,
//         fTop: focusRect.corner.y,
//         wBot: windowRect.corner.y + windowRect.height,
//         fBot: focusRect.corner.y + focusRect.height,
//     };
// }
//
// private getLeftRight(windowRect: Rect, focusRect: Rect) {
//     return {
//         fLeft: focusRect.corner.x,
//         wLeft: windowRect.corner.x,
//         fRight: focusRect.corner.x + focusRect.width,
//         wRight: windowRect.corner.x + windowRect.width,
//     };
// }
//
// public getVertScrollOff(windowRect: Rect) {
//     return this.host._getAnyProp("keepFocusedCenter")
//         ? Math.floor(windowRect.height / 2)
//         : Math.min(this.host._getAnyProp("scrollOff") ?? 0, windowRect.height - 1);
// }
//
// public getHorizScrollOff(windowRect: Rect) {
//     return this.host._getAnyProp("keepFocusedCenter")
//         ? Math.floor(windowRect.width / 2)
//         : Math.min(this.host._getAnyProp("scrollOff") ?? 0, windowRect.width - 1);
// }
//
// public getVertVisibility(
//     windowRect: Rect,
//     focusRect: Rect,
//     dir: -1 | 1 = 1,
//         useScrollOff = false,
// ): { above: number; below: number } {
//         const { wTop, fTop, wBot, fBot } = this.getTopBottom(windowRect, focusRect);
//         const scrollOff = useScrollOff ? this.getVertScrollOff(windowRect) : 0;
//
//         const itemAboveWin = fTop < wTop + scrollOff;
//         const itemBelowWin = fBot > wBot - scrollOff;
//
//         const above = wTop + scrollOff - fTop;
//         const below = fBot - wBot + scrollOff;
//
//         if (itemAboveWin || itemBelowWin) {
//             // Conditionally flipping based dir maintains symmetry when scrollOff is present
//             return dir > 0 ? { above, below: 0 } : { below, above: 0 };
//         }
//         return { above: 0, below: 0 };
//     }
//
//     public getHorizVisibility(
//         windowRect: Rect,
//         focusRect: Rect,
//         dir: -1 | 1 = 1,
//             useScrollOff = false,
//     ): { left: number; right: number } {
//             const { wLeft, fLeft, wRight, fRight } = this.getLeftRight(windowRect, focusRect);
//             const scrollOff = useScrollOff ? this.getHorizScrollOff(windowRect) : 0;
//
//             const itemLeftWin = fLeft < wLeft + scrollOff;
//             const itemRightWin = fRight > wRight - scrollOff;
//
//             const left = wLeft + scrollOff - fLeft;
//             const right = fRight - wRight + scrollOff;
//
//             if (itemLeftWin || itemRightWin) {
//                 return dir > 0 ? { left, right: 0 } : { right, left: 0 };
//             }
//             return { left: 0, right: 0 };
//         }
//
//         private focusScrollDown(toScroll: number) {
//             this.host._scrollManager.scrollDown(toScroll, true);
//         }
//         private focusScrollUp(toScroll: number) {
//             this.host._scrollManager.scrollUp(toScroll, true);
//         }
//         private focusScrollLeft(toScroll: number) {
//             this.host._scrollManager.scrollLeft(toScroll, true);
//         }
//         private focusScrollRight(toScroll: number) {
//             this.host._scrollManager.scrollRight(toScroll, true);
//         }
//
//         /**
//          * @internal
//          * Adjust the `_scrollOffset` in order to keep the focused element in view
//          */
//         public normalizeScrollToFocus(d: "up" | "down" | "left" | "right") {
//             if (!this.focused) return;
//             if (!this.host._getAnyProp("keepFocusedVisible")) return;
//
//             const isVertScroll = d === "down" || d === "up";
//             const isNegScroll =
//                 d === "down" || d === "left" || this.host._getAnyProp("keepFocusedCenter");
//
//             const fRect = this.getFocusItemRect();
//             const wRect = this.getWindowRect();
//             if (!fRect || !wRect) return;
//
//             // If focus item is too large for window, pin to top or left
//             if (isVertScroll && fRect.height >= wRect.height) {
//                 const toScroll = fRect.corner.y - wRect.corner.y;
//                 if (toScroll > 0) this.focusScrollDown(toScroll);
//                 else this.focusScrollUp(Math.abs(toScroll));
//                 return;
//             }
//             if (!isVertScroll && fRect.width >= wRect.width) {
//                 const toScroll = fRect.corner.x - wRect.corner.x;
//                 if (toScroll > 0) this.focusScrollRight(toScroll);
//                 else this.focusScrollLeft(Math.abs(toScroll));
//                 return;
//             }
//
//             if (isVertScroll) {
//                 const { above, below } = this.getVertVisibility(
//                     wRect,
//                     fRect,
//                     isNegScroll ? -1 : 1,
//                     true,
//                 );
//
//                 if (above) {
//                     this.focusScrollUp(above);
//                 } else if (below) {
//                     this.focusScrollDown(below);
//                 }
//             } else {
//                 const { left, right } = this.getHorizVisibility(
//                     wRect,
//                     fRect,
//                     isNegScroll ? -1 : 1,
//                     true,
//                 );
//
//                 if (left) {
//                     this.focusScrollLeft(left);
//                 } else if (right) {
//                     this.focusScrollRight(right);
//                 }
//             }
//         }
//
//         /**
//          * @internal
//          *
//          * Handle layout changes or first renders that have pushed the focused item
//          * out of visibility, and subsequently adjust the corner offset **without**
//          * causing a re-render since this will be handled during compositing.
//          *
//          * @returns `true` if the corner offset was adjusted
//          * */
//         public _adjustOffsetToFocus(): boolean {
//             // Allow for non-focus scrolling to occur and obscure the focused child
//             if (!this.host._scrollManager.lastOffsetChangeWasFocus) return false;
//             if (!this.host._getAnyProp("keepFocusedVisible")) return false;
//
//             const windowRect = this.getWindowRect();
//             const focusRect = this.getFocusItemRect();
//             if (!windowRect || !focusRect) return false;
//
//             const { above, below } = this.getVertVisibility(windowRect, focusRect);
//             const { left, right } = this.getHorizVisibility(windowRect, focusRect);
//
//             // Focused item is visible - no need to adjust corner offset
//             if (!above && !below && !left && !right) {
//                 return false;
//             }
//
//             if (above || below) this.normalizeScrollToFocus("up");
//             if (left || right) this.normalizeScrollToFocus("left");
//             return true;
//         }
//
//         private displaceFocus(dx: number, dy: number): DomElement | undefined {
//             const data = this.getFocusedData();
//             if (!data) return;
//             if (!dx && !dy) return;
//
//             const applyDisplacement = (d: number, idx?: number, arr?: DomElement[]) => {
//                 if (!arr || idx === undefined) return;
//
//                 let next = idx + d;
//
//                 if (this.host._getAnyProp("fallthrough")) {
//                     if (next < 0) {
//                         next = arr.length - 1;
//                     } else if (next > arr.length - 1) {
//                         next = 0;
//                     }
//                 }
//
//                 if (d < 0) {
//                     next = Math.max(0, next);
//                 } else {
//                     next = Math.min(arr.length - 1, next);
//                 }
//
//                 this.focusChild(arr[next]);
//                 return arr[next];
//             };
//
//             const result = dx
//                 ? applyDisplacement(dx, data.xIdx, data.xArr)
//                 : applyDisplacement(dy, data.yIdx, data.yArr);
//
//                 return result;
//         }
//
//         /** @internal */
//         public _refreshVisualMap() {
//             // const children = this.strategy.getNavigableChildren();
//             // this.visualMap = new Map();
//             // this.strategy.buildVisualMap(children, this.visualMap);
//
//             const children = this.strategy.getNavigableChildren();
//             this.visualMap = this.strategy.buildVisualMap(children);
//         }
//
//         public getFocusedData() {
//             if (!this.focused) return;
//             return this.visualMap.get(this.focused);
//         }
//
//         private getYArr() {
//             return this.getFocusedData()?.yArr;
//         }
//
//         private getXArr() {
//             return this.getFocusedData()?.xArr;
//         }
//
//         public focusDown(): DomElement | undefined {
//             const data = this.getFocusedData();
//             if (!data) return;
//             if (data.down) {
//                 return this.focusChild(data.down);
//             }
//         }
//         public focusUp(): DomElement | undefined {
//             const data = this.getFocusedData();
//             if (!data) return;
//             if (data.up) {
//                 return this.focusChild(data.up);
//             }
//         }
//         public focusLeft(): DomElement | undefined {
//             const data = this.getFocusedData();
//             if (!data) return;
//             if (data.left) {
//                 return this.focusChild(data.left);
//             }
//         }
//         public focusRight(): DomElement | undefined {
//             const data = this.getFocusedData();
//             if (!data) return;
//             if (data.right) {
//                 return this.focusChild(data.right);
//             }
//         }
//         public displaceDown(n = 1): DomElement | undefined {
//             const data = this.getFocusedData();
//             if (!data) return;
//
//             return this.displaceFocus(0, Math.abs(n));
//         }
//         public displaceUp(n = 1): DomElement | undefined {
//             const data = this.getFocusedData();
//             if (!data) return;
//
//             return this.displaceFocus(0, -Math.abs(n));
//         }
//         public displaceLeft(n = 1): DomElement | undefined {
//             const data = this.getFocusedData();
//             if (!data) return;
//
//             return this.displaceFocus(-Math.abs(n), 0);
//         }
//         public displaceRight(n = 1): DomElement | undefined {
//             const data = this.getFocusedData();
//             if (!data) return;
//
//             return this.displaceFocus(Math.abs(n), 0);
//         }
//         public focusXIdx(nextIdx: number): DomElement | undefined {
//             const xArr = this.getXArr();
//             if (!xArr || !xArr[nextIdx]) return;
//
//             const prevIdx = this.getFocusedData()?.xIdx ?? 0;
//             const displacement = nextIdx - prevIdx;
//
//             return this.displaceFocus(displacement, 0);
//         }
//         public focusYIdx(nextIdx: number): DomElement | undefined {
//             const yArr = this.getYArr();
//             if (!yArr || !yArr[nextIdx]) return;
//
//             const prevIdx = this.getFocusedData()?.yIdx ?? 0;
//             const displacement = nextIdx - prevIdx;
//
//             return this.displaceFocus(0, displacement);
//         }
//         public focusFirstX(): DomElement | undefined {
//             const xArr = this.getXArr();
//             if (!xArr || !xArr[0]) return;
//
//             return this.focusChild(xArr[0]);
//         }
//         public focusFirstY(): DomElement | undefined {
//             const yArr = this.getYArr();
//             if (!yArr || !yArr[0]) return;
//
//             return this.focusChild(yArr[0]);
//         }
//         public focusLastX(): DomElement | undefined {
//             const xArr = this.getXArr();
//             if (!xArr || !xArr.length) return;
//
//             return this.focusChild(xArr[xArr.length - 1]);
//         }
//         public focusLastY(): DomElement | undefined {
//             const yArr = this.getYArr();
//             if (!yArr || !yArr.length) return;
//
//             return this.focusChild(yArr[yArr.length - 1]);
//         }
