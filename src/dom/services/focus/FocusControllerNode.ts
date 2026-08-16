import { DomElement } from "../../DomElement.js";
import type { FocusControllerService } from "./FocusControllerService.js";
import { FocusNode } from "./FocusNode.js";
import { CONTROLLED_STATE } from "./FocusNode.js";

export class FocusControllerNode extends FocusNode {
    private _focusService: FocusControllerService;

    private _controlledNodes: Set<FocusNode>;
    public get controlledNodes() {
        return this._controlledNodes;
    }

    private _focused: FocusNode | undefined;
    public get focused() {
        return this._focused;
    }

    constructor(host: DomElement, _focusService: FocusControllerService) {
        super(host);
        this._focusService = _focusService;
        this._controlledNodes = new Set();
        this._focused = undefined;
    }

    private setChildFocus(child: FocusNode, value: boolean) {
        if (child[CONTROLLED_STATE].focus !== value) {
            child[CONTROLLED_STATE].focus = value;
            child.onFocusChange();
        }
    }
    private setChildController(child: FocusNode, value: FocusControllerNode | undefined) {
        if (child[CONTROLLED_STATE].controller !== value) {
            child[CONTROLLED_STATE].controller = value;
        }
    }
    private setChildProvidesContext(child: FocusNode, value: boolean) {
        if (child[CONTROLLED_STATE].providesContext !== value) {
            child[CONTROLLED_STATE].providesContext = value;
        }
    }

    public bindChild(node: FocusNode) {
        this._controlledNodes.add(node);
        this.setChildController(node, this);
        this.createProvider(node);
        this.setChildFocus(node, false);
    }
    public unbindChild(node: FocusNode) {
        if (!this._controlledNodes.has) return;
        this._controlledNodes.delete(node);
        this.setChildController(node, undefined);
        this.createConsumer(node);
        this.setChildFocus(node, true);

        if (this._focused === node) {
            this._focused = undefined;
        }
    }

    private createProvider(node: FocusNode) {
        this.setChildProvidesContext(node, true);
        node.rippleProviderChange();
    }

    private createConsumer(node: FocusNode) {
        this.setChildProvidesContext(node, false);
        node.rippleConsumerChange();
    }

    public focusControlledNode(node: FocusNode) {
        if (!this._controlledNodes.has(node)) return;
        if (this._focused === node) return;

        if (this._focused) {
            this.setChildFocus(this._focused, false);
        }

        const prevHost = this._focused?.host;
        const nextHost = node.host;

        this._focused = node;
        this.setChildFocus(node, true);

        this._focusService.handleFocusChange(prevHost, nextHost);
    }

    public blurControlledNode(node: FocusNode) {
        if (!this._controlledNodes.has(node)) return;
        if (this._focused !== node) return;

        this._focused = undefined;
        this.setChildFocus(node, false);
    }
}
