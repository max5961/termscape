import { FocusController } from "./DomElement.js";
import type { DomElement, TTagNames } from "../Types.js";
import { BoxElement } from "./BoxElement.js";
import { DOM_ELEMENT_FOCUS_NODE } from "../Symbols.js";
import type {
    VirtualStyle,
    VirtualLayoutStyle,
    ShadowLayoutStyle,
} from "../style/Style.js";

export class LayoutElement extends FocusController<
    VirtualLayoutStyle,
    ShadowLayoutStyle
> {
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

    protected override handleAppend(child: DomElement): void {
        if (!this.focused) {
            this.dfs(child, (elem) => {
                if (elem instanceof LayoutNode) {
                    child[DOM_ELEMENT_FOCUS_NODE].updateCheckpoint(true);
                    this.focused = child;
                    return;
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
        this.focusNode.becomeCheckpoint(false);
    }
}
