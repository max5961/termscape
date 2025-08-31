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

        const dfs = (child: DomElement) => {
            if (child instanceof LayoutNode) {
                nodes.push(child);
            } else {
                child.children.forEach((child) => dfs(child));
            }
        };
        this.children.forEach((child) => dfs(child));

        return nodes;
    }

    protected override handleAppendChild(child: DomElement): void {
        if (this.focused) return;

        let found = false;
        this.dfs(child, (child) => {
            if (!found && child instanceof LayoutNode) {
                child[DOM_ELEMENT_FOCUS_NODE].updateCheckpoint(true);
                this.focused = child;
                found = true;
            }
        });
    }

    // NOOP
    // prettier-ignore
    protected override handleRemoveChild(_child: DomElement, _freeRecursive?: boolean): void {}

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
    public override focusChild(child: LayoutNode) {
        return super.focusChild(child);
    }
    public focusById(id: string): DomElement | undefined {
        const entries = Array.from(this.visualMap.entries());
        let found: DomElement | undefined;
        for (let i = 0; i < entries.length; ++i) {
            const [elem] = entries[i];
            if (elem.getAttribute("id") === id) {
                found = elem;
                break;
            }
        }

        if (found) {
            return super.focusChild(found);
        }
    }
}

export class LayoutNode extends BoxElement {
    constructor() {
        super();
        this.focusNode.becomeCheckpoint(false);
        this.tagName = "LAYOUT_NODE";
    }
}
