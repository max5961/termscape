import type { ListStyle, VirtualStyle } from "../Types.js";
import type { DomElement } from "./DomElement.js";
import { FocusController } from "./DomElement.js";

export class ListElement extends FocusController<ListStyle, ListStyle> {
    public override tagName: "LIST_ELEMENT";

    constructor() {
        super();
        this.tagName = "LIST_ELEMENT";
    }

    protected override defaultStyles: VirtualStyle = {
        flexDirection: "column",
        flexWrap: "nowrap",
        overflow: "scroll",
        height: "100",
        width: "100",
        fallthrough: false,
        keepFocusedCenter: false,
        keepFocusedVisible: true,
        blockChildrenShrink: true,
    };

    /**
     * Adjust the `scrollOffset` in order to keep the focused element in view
     */
    protected adjustScrollOffset(nextFocus: DomElement, isScrollDown: boolean) {
        this.focused = nextFocus;

        // Scroll Window Rect & Focus Item Rect
        const fRect = this.focused.getUnclippedRect();
        const wRect = this.canvas?.unclippedContentRect;
        if (!fRect || !wRect) return;

        const fTop = fRect.corner.y;
        const wTop = wRect.corner.y;
        const fBot = fRect.corner.y + fRect.height;
        const wBot = wRect.corner.y + wRect.height;

        const scrollOff = this.style.keepFocusedCenter
            ? Math.floor(this.node.getComputedHeight() / 2)
            : Math.min(this.style.scrollOff ?? 0, wBot);

        // If focus item is as large or larger than window, pin to top.
        if (fRect.height >= wRect.height) {
            const toScroll = fTop - wTop;
            if (toScroll > 0) {
                this.scrollDown(toScroll);
            } else {
                this.scrollUp(Math.abs(toScroll));
            }
            return;
        }

        const itemBelowWin = fBot > wBot - scrollOff;
        const itemAboveWin = fTop <= wTop + scrollOff;

        const scroll = () => {
            return isScrollDown
                ? this.scrollDown(fBot - wBot + scrollOff)
                : this.scrollUp(wTop + scrollOff - fTop);
        };

        if (itemBelowWin) {
            return scroll();
        }
        if (itemAboveWin) {
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
    }

    public focusNext(num?: number) {
        num ??= 1;
        const next = this.focusDisplacement(0, num);
        if (next) {
            this.adjustScrollOffset(next, true);
        }
    }

    public focusPrev(num?: number) {
        num ??= 1;
        const next = this.focusDisplacement(0, -Math.abs(num));
        if (next) {
            this.adjustScrollOffset(next, false);
        }
    }

    // public focusFirst() {
    //     // this.handleIdxChange(0);
    // }
    //
    // public focusLast() {
    //     // this.handleIdxChange(this.children.length - 1);
    // }
    //
    // public goToIndex(idx: number) {
    //     // this.handleIdxChange(idx);
    // }
}
