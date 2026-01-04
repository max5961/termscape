import type { DomElement } from "../DomElement.js";

type FocusState = { focus: boolean; shallowFocus: boolean };

export class FocusNode {
    private _childNodes: Set<FocusNode>;
    private _parent: FocusNode | null;
    private _nearestProvider: Provider | null;
    private _ownProvider: Provider | null;
    private _host: DomElement;

    constructor(elem: DomElement) {
        this._childNodes = new Set();
        this._nearestProvider = null;
        this._ownProvider = null;
        this._host = elem;
        this._parent = null;
    }

    // CHORE - appendChild and removeChild needs tests to ensure Provider chain
    // is predictable/stable

    public appendChild(node: FocusNode) {
        node._parent = this;
        if (!node._nearestProvider) {
            node._nearestProvider = this._nearestProvider;
        }
        this._childNodes.add(node);
    }

    public removeChild(node: FocusNode) {
        this._childNodes.delete(node);
        node._parent = null;

        if (node._nearestProvider === this._nearestProvider) {
            node._nearestProvider = null;
        }

        this.rewireChildren(this._ownProvider);
    }

    public getFocusState(): FocusState {
        if (this._nearestProvider) {
            return this._nearestProvider.status;
        }
        return { focus: true, shallowFocus: false };
    }

    public getFocus(): boolean {
        return this.getFocusState().focus;
    }

    public getShallowFocus(): boolean {
        return this.getFocusState().shallowFocus;
    }

    public focusNearestProvider() {
        if (this._nearestProvider) {
            this._nearestProvider.focused = true;
        }
    }

    /**
     * Make this node provide focus context for descendents.
     * */
    public becomeProvider(focused: boolean) {
        if (this._ownProvider) return;

        const provider = new Provider(focused);

        const nearest = this._nearestProvider;
        if (nearest) {
            provider.parent = nearest;
        }

        this._ownProvider = provider;
        this._nearestProvider = provider;
        this.propagateChanges();
    }

    /**
     * If this node is a Provider, then modify the focus context that its
     * consumers will receive.
     * */
    public setOwnProvider(focused: boolean) {
        if (!this._ownProvider) return;
        this._ownProvider.focused = focused;
        this.propagateChanges();
    }

    /**
     * Destroy the node's Provider object (if not already null).
     * @param freeRecursive boolean.  If true, then it is assumed the host DomElement
     * and its children are being destroyed, so no time is wasted propagating changes.
     * */
    public becomeConsumer(freeRecursive?: boolean) {
        if (!this._ownProvider) return;

        this._ownProvider = null;
        this._nearestProvider = this._parent?._nearestProvider ?? null;
        if (!freeRecursive) {
            this.propagateChanges();
        }
    }

    private propagateChanges() {
        this.rewireChildren(this._nearestProvider);
        this.reapplyStyles(this._host);
    }

    private reapplyStyles = (elem: DomElement) => {
        const styleHandler = elem._styleHandler;

        if (styleHandler) {
            elem.style = styleHandler;
        }

        elem._children.forEach((child) => {
            this.reapplyStyles(child);
        });
    };

    private rewireChildren(nearest: Provider | null) {
        this._childNodes.forEach((child) => this.rewireHelper(child, nearest));
    }

    private rewireHelper = (node: FocusNode, nearest: Provider | null) => {
        if (node._ownProvider) return;
        node._nearestProvider = nearest;

        const styleHandler = node._host._styleHandler;
        if (styleHandler) {
            node._host.style = styleHandler;
        }

        node._childNodes.forEach((child) => this.rewireHelper(child, nearest));
    };
}

export class Provider {
    public parent: Provider | null;
    public focused: boolean;

    constructor(focused: boolean) {
        this.focused = focused;
        this.parent = null;
    }

    public get status(): FocusState {
        if (!this.focused) {
            return { focus: false, shallowFocus: false };
        }

        const result: FocusState = { focus: true, shallowFocus: false };
        let parent: Provider | null = this.parent;

        while (parent) {
            if (!parent.focused) {
                return { focus: false, shallowFocus: true };
            }
            parent = parent.parent;
        }

        return result;
    }
}
