import { FocusManager } from "./DomElement.js";
import type { DomElement, TTagNames } from "../Types.js";
import { BoxElement } from "./BoxElement.js";
import { DOM_ELEMENT_FOCUS_NODE } from "../Symbols.js";
import type {
    VirtualStyle,
    VirtualLayoutStyle,
    ShadowLayoutStyle,
} from "../style/Style.js";

export class LayoutElement extends FocusManager<VirtualLayoutStyle, ShadowLayoutStyle> {
    public override tagName: TTagNames;

    constructor() {
        super();
        this.tagName = "LAYOUT_ELEMENT";
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
        blockChildrenShrink: false,
    };

    protected override getNavigableChildren(): DomElement[] {
        const nodes: LayoutNode[] = [];

        this.dfs(this, (elem) => {
            if (elem instanceof LayoutNode) {
                nodes.push(elem);
            }
        });

        return nodes;
    }

    protected override handleAppendChild(child: DomElement): void {
        if (!this.focused) return;

        this.dfs(child, (elem) => {
            if (elem instanceof LayoutNode) {
                child[DOM_ELEMENT_FOCUS_NODE].updateCheckpoint(true);
                this.focused = child;
                return;
            }
        });
    }

    protected override handleRemoveChild(
        _child: DomElement,
        _freeRecursive?: boolean,
    ): void {
        // noop
    }

    public override focusUp(units = 1) {
        return super.focusUp(units);
    }
    public override focusDown(units = 1) {
        return super.focusDown(units);
    }
    public override focusLeft(units = 1) {
        return super.focusLeft(units);
    }
    public override focusRight(units = 1) {
        return super.focusRight(units);
    }
}

export class LayoutNode extends BoxElement {
    constructor() {
        super();
        this.focusNode.becomeCheckpoint(false);
    }
}
