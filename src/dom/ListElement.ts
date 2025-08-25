import type { ListStyle, VirtualStyle } from "../Types.js";
import { DomElement } from "./DomElement.js";

export class ListElement extends DomElement<ListStyle, ListStyle> {
    public override tagName: "LIST_ELEMENT";
    private idx: number;
    private focused: DomElement | undefined;

    constructor() {
        super();
        this.tagName = "LIST_ELEMENT";
        this.idx = 0;
        this.focused = undefined;
        this.onChildrenUpdate = this.handleChildrenUpdate;
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
    };

    public get focusedElement(): DomElement | undefined {
        return this.focused;
    }

    protected handleChildrenUpdate() {
        this.idx = Math.min(this.idx, this.children.length - 1);
        this.handleIdxChange(this.idx);
    }

    protected handleIdxChange(nextIdx: number): void {
        if (!this.children[nextIdx] || this.idx === nextIdx) return;

        if (this.focused) {
            this.focused.focus = false;
        }

        const isScrollDown = nextIdx - this.idx > 0;

        this.idx = nextIdx;
        this.focused = this.children[this.idx];
        this.focused.focus = true;

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

        // If focus is larger than window, pin to top
        if (fRect.height >= wRect.height) {
            const toScroll = fTop - wTop;
            if (toScroll > 0) {
                this.scrollDown(toScroll);
            } else {
                this.scrollUp(Math.abs(toScroll));
            }
            return;
        }

        if (isScrollDown) {
            if (fBot > wBot - scrollOff) {
                return this.scrollDown(fBot - wBot + scrollOff);
            }
        } else {
            if (fTop <= wTop + scrollOff) {
                return this.scrollUp(wTop + scrollOff - fTop);
            }
        }
    }

    public focusNext(num?: number, cb?: () => unknown) {
        num ??= 1;

        // Jumps greater than 1 should squash to their allowed max when at the end
        if (this.idx + num >= this.children.length) {
            num = this.children.length - 1;
        }

        this.handleIdxChange(this.idx + num);
        cb?.();
    }

    public focusPrev(num?: number, cb?: () => unknown) {
        num ??= 1;
        if (this.idx - num < 0) {
            num = 0;
        }

        this.handleIdxChange(this.idx - num);
        cb?.();
    }

    public focusFirst(cb?: () => unknown) {
        this.handleIdxChange(0);
        cb?.();
    }

    public focusLast(cb?: () => unknown) {
        this.handleIdxChange(this.children.length - 1);
        cb?.();
    }

    public goToIndex(idx: number, cb?: () => unknown) {
        this.handleIdxChange(idx);
        cb?.();
    }
}
