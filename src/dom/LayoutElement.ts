import { FocusController } from "./DomElement.js";
import type { DomElement, LayoutStyle, TTagNames, VirtualStyle } from "../Types.js";
import { BoxElement } from "./BoxElement.js";
import { DOM_ELEMENT_FOCUS } from "../Symbols.js";

export class LayoutElement extends FocusController<LayoutStyle, LayoutStyle> {
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
        this.checkNode(this, nodes);
        return nodes;
    }

    private checkNode(node: DomElement, nodes: LayoutNode[]) {
        if (node instanceof LayoutNode) {
            nodes.push(node);
        }
        node.children.forEach((node) => {
            this.checkNode(node, nodes);
        });
    }

    protected override handleAppend(child: DomElement): void {
        child[DOM_ELEMENT_FOCUS] = false;

        if (!this.focused) {
            this.dfs(child, (elem) => {
                if (elem instanceof LayoutNode && !this.focused) {
                    child[DOM_ELEMENT_FOCUS] = true;
                    this.focused = child;
                }
            });
        }
    }

    public override focusUp() {
        return super.focusUp();
    }
    public override focusDown() {
        return super.focusDown();
    }
    public override focusLeft() {
        return super.focusLeft();
    }
    public override focusRight() {
        return super.focusRight();
    }
}

export class LayoutNode extends BoxElement {
    constructor() {
        super();
    }
}
