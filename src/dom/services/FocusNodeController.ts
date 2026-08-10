import { DomElement } from "../DomElement.js";
import { FocusNode } from "./FocusNode.js";

export class FocusNodeController extends FocusNode {
    public controlledNodes: Set<FocusNode>;
    public focused: FocusNode | undefined;

    constructor(host: DomElement) {
        super(host);
        this.controlledNodes = new Set();
        this.focused = undefined;
    }

    public bindChild(node: FocusNode) {
        this.controlledNodes.add(node);
        node.controller = this;
        node.focus = false;
        this.createProvider(node);
    }
    public unbindChild(node: FocusNode) {
        this.createConsumer(node);
        this.controlledNodes.delete(node);
        node.controller = undefined;
        node.focus = true;

        if (this.focused === node) {
            this.focused = undefined;
        }
    }

    private createProvider(node: FocusNode) {
        if (!this.controlledNodes.has(node)) return;
        node.providesContext = true;

        node.propagateProviderChange();
    }

    private createConsumer(node: FocusNode) {
        if (!this.controlledNodes.has(node)) return;
        node.providesContext = false;

        node.rippleConsumerChanges();
    }

    public focusNode(node: FocusNode) {
        if (!this.controlledNodes.has(node)) return;
        if (this.focused === node) return;

        if (this.focused) {
            this.focused.focus = false;
        }
        // const prev = this.focused;
        this.focused = node;
        node.focus = true;

        // this.host._focusService.focusChange(prev, this.focused);
    }

    public blurNode(node: FocusNode) {
        if (!this.controlledNodes.has(node)) return;
        if (this.focused !== node) return;

        this.focused = undefined;
        node.focus = false;
    }
}
