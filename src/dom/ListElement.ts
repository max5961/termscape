import type { ShadowListStyle, VirtualListStyle, VirtualStyle } from "../style/Style.js";
import { DOM_ELEMENT_FOCUS_NODE } from "../Symbols.js";
import type { DomElement } from "./DomElement.js";
import { FocusManager } from "./DomElement.js";

export class ListElement extends FocusManager<VirtualListStyle, ShadowListStyle> {
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

    protected override getNavigableChildren(): DomElement[] {
        return this.children.slice();
    }

    protected override handleAppendChild(child: DomElement): void {
        child[DOM_ELEMENT_FOCUS_NODE].becomeCheckpoint(false);
        if (this.children.length === 1) {
            child[DOM_ELEMENT_FOCUS_NODE].updateCheckpoint(true);
            this.focused = child;
        }

        // TODO - this needs to be dynamic so change to this value should
        // modify all existing children
        if (this.style.blockChildrenShrink) {
            child.style.flexShrink = 0;
        }
    }

    protected override handleRemoveChild(
        child: DomElement,
        freeRecursive?: boolean,
    ): void {
        child[DOM_ELEMENT_FOCUS_NODE].becomeNormal(freeRecursive);
    }

    private isLTR(): boolean | undefined {
        return this.style.flexDirection?.includes("row");
    }

    public focusNext(units = 1) {
        return this.isLTR() ? super.focusRight(units) : super.focusDown(units);
    }

    public focusPrev(units = 1) {
        return this.isLTR() ? super.focusLeft(units) : super.focusUp(units);
    }

    public focusFirst() {
        return this.isLTR() ? super.focusFirstX() : super.focusFirstY();
    }

    public focusLast() {
        return this.isLTR() ? super.focusLastX() : super.focusLastY();
    }

    public focusElement(element: DomElement) {
        return super.focusChild(element);
    }

    public focusIndex(idx: number) {
        return this.isLTR() ? super.focusXIdx(idx) : super.focusYIdx(idx);
    }
}
