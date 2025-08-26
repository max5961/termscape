import { DOM_ELEMENT_FOCUS } from "../Symbols.js";
import type { ListStyle, VirtualStyle } from "../Types.js";
import type { DomElement } from "./DomElement.js";
import { FocusController } from "./DomElement.js";

export class ListElement extends FocusController<ListStyle, ListStyle> {
    public override tagName: "LIST_ELEMENT";
    private idx: number;

    constructor() {
        super();
        this.tagName = "LIST_ELEMENT";
        this.idx = 0;
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

    public get focused(): DomElement | undefined {
        return this.children[this.idx];
    }

    public override focusChild(child: DomElement): void {
        const idx = this.children.indexOf(child);
        if (idx >= 0) {
            this.handleIdxChange(idx);
        }
    }

    protected override handleAppend(child: DomElement): void {
        if (this.children.length === 1) {
            child[DOM_ELEMENT_FOCUS] = true;
        } else {
            child[DOM_ELEMENT_FOCUS] = false;
        }
    }

    protected override handleRemove(_child: DomElement): void {
        if (this.idx > this.children.length - 1) {
            this.handleIdxChange(this.children.length - 1);
        }
    }

    protected handleIdxChange(nextIdx: number): void {
        if (!this.children[nextIdx] || this.idx === nextIdx) return;

        if (this.focused) {
            this.focused[DOM_ELEMENT_FOCUS] = false;
        }

        const isScrollDown = nextIdx - this.idx > 0;

        this.idx = nextIdx;
        if (this.focused) {
            this.focused[DOM_ELEMENT_FOCUS] = true;
        }

        this.adjustScrollOffset(isScrollDown);
    }

    /**
     * Adjust the `scrollOffset` in order to keep the focused element in view
     */
    protected adjustScrollOffset(isScrollDown: boolean) {
        if (!this.focused) return;

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
        num = Math.abs(num ?? 1);

        let target = this.idx + num;
        const diff = this.children.length - 1 - target;
        if (this.style.fallthrough && diff < 0) {
            target = 0;
        } else {
            target = Math.min(this.children.length - 1, target);
        }

        this.handleIdxChange(target);
    }

    public focusPrev(num?: number) {
        num = Math.abs(num ?? 1);

        let target = this.idx - num;
        if (this.style.fallthrough && target < 0) {
            target = this.children.length - 1;
        } else {
            target = Math.max(0, target);
        }

        this.handleIdxChange(target);
    }

    public focusFirst() {
        this.handleIdxChange(0);
    }

    public focusLast() {
        this.handleIdxChange(this.children.length - 1);
    }

    public goToIndex(idx: number) {
        this.handleIdxChange(idx);
    }
}
