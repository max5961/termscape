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
        centerScroll: false,
        keepFocusedVisible: true,
    };

    public get focusedElement(): DomElement | undefined {
        return this.focused;
    }

    protected handleChildrenUpdate() {
        this.idx = Math.min(this.idx, this.children.length - 1);
        const succ = this.handleIdxChange(this.idx);
        if (succ) {
            this.adjustScrollOffset();
        }
    }

    /**
     * Adjust the `scrollOffset` in order to keep the focused element in view
     */
    protected adjustScrollOffset() {
        if (!this.focused) return;

        const fRect = this.focused.getUnclippedRect();
        const cRect = this.canvas?.unclippedContentRect;

        if (!fRect || !cRect) return;

        const fDepth = fRect.corner.y + fRect.height;
        const cDepth = cRect.corner.y + cRect.height;

        if (cRect.corner.y <= fRect.corner.y) {
            if (fRect.height >= cRect.height) return;

            const toScrollUp = cDepth - fDepth;
            return this.scrollUp(toScrollUp);
        } else if (cRect.corner.y > fRect.corner.y) {
            const toScrollDown = fRect.corner.y + cRect.corner.y;
            return this.scrollDown(toScrollDown);
        }
    }

    protected handleIdxChange(nextIdx: number): boolean {
        if (!this.children[nextIdx]) return false;

        if (this.focused) {
            this.focused.focus = false;
        }

        this.idx = nextIdx;
        this.focused = this.children[this.idx];
        this.focused.focus = true;

        return true;
    }

    public focusNext(cb?: () => unknown) {
        const succ = this.handleIdxChange(this.idx + 1);
        if (!succ) return;
        this.adjustScrollOffset();
        cb?.();
    }

    public focusPrev(cb: () => unknown) {
        const succ = this.handleIdxChange(this.idx - 1);
        if (!succ) return;
        this.adjustScrollOffset();
        cb?.();
    }

    public focusFirst() {
        const succ = this.handleIdxChange(0);
        if (!succ) return;
    }

    public focusLast() {
        const succ = this.handleIdxChange(this.children.length - 1);
        if (!succ) return;
    }

    public goToIndex(idx: number) {
        const succ = this.handleIdxChange(idx);
        if (!succ) return;
    }
}
