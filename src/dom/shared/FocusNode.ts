import type { DomElement } from "../DomElement.js";
import type { DomEvents } from "./DomEvents.js";

// CHORE - move to types
export type FocusState = { focus: boolean; shallowFocus: boolean };

export class FocusNode {
    private _childNodes: Set<FocusNode>;
    private _parent: FocusNode | null;
    private _nearestProvider: Provider | null;
    private _ownProvider: Provider | null;
    private _host: DomElement;
    private _currStatus: FocusState;

    /** @internal */
    public _getCurrStatus(): FocusState {
        // Sread to ensure status is closed to mutation publically (could be mutated in a style handler for example)
        return { ...this._currStatus };
    }
    /** @internal */
    public _getCurrFocus(): boolean {
        return this._currStatus.focus;
    }
    /** @internal */
    public _getCurrShallowFocus(): boolean {
        return this._currStatus.shallowFocus;
    }

    constructor(elem: DomElement) {
        this._childNodes = new Set();
        this._nearestProvider = null;
        this._ownProvider = null;
        this._host = elem;
        this._parent = null;
        this._currStatus = { focus: true, shallowFocus: false };
    }

    // CHORE - appendChild and removeChild needs tests to ensure Provider chain
    // is predictable/stable

    public addChild(node: FocusNode) {
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
            node.handleProviderChange(true);
        }
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
        this.handleProviderChange(true, true);
    }

    /**
     * If this node is a Provider, then modify the focus context that its
     * consumers will receive.
     * */
    public setOwnProvider(focused: boolean) {
        if (!this._ownProvider) return;
        if (this._ownProvider.focused === focused) return;
        this._ownProvider.focused = focused;

        this.handleProviderChange(false);
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
            this.handleProviderChange(true);
        }
    }

    private suppressEvents = false;
    /**
     * @param transformed false if only status change, true if change to Provider chain
     * @param silent suppresses onFocus/onBlur handlers from executing.  Never suppresses except for when becoming a Provider
     * because initial focusing should not trigger handlers
     * */
    private handleProviderChange(transformed: boolean, silent = false) {
        this.suppressEvents = silent;

        if (transformed) {
            this._childNodes.forEach((node) => {
                this.rewireNearest(node, this._nearestProvider);
            });
        }

        this.propagateChanges();
    }

    /** Updates nearest provider to direct children until the next provider */
    private rewireNearest(node: FocusNode, nearest: Provider | null) {
        // Necessary to link existing Providers and allow for shallowFocus data
        if (node._ownProvider) {
            node._ownProvider.parent = nearest;
            return;
        }

        node._nearestProvider = nearest;
        node._childNodes.forEach((chnode) => {
            this.rewireNearest(chnode, nearest);
        });
    }

    /** Handles status change handlers and reassign style handlers */
    private propagateChanges() {
        this.handleStatusChange();

        const styleHandler = this._host._styleHandler;
        if (styleHandler) {
            this._host.style = styleHandler;
        }

        this._childNodes.forEach((child) => {
            child.propagateChanges();
        });
    }

    /** Updates _currStatus and dispatches focus change handlers */
    private handleStatusChange() {
        const prev = this._currStatus;
        const next = this.getFocusState();

        if (prev.focus !== next.focus || prev.shallowFocus !== next.shallowFocus) {
            this._currStatus = next;

            if (!this.suppressEvents) {
                this.dispatchChangeHandlers(prev, next);
            }
        }
    }

    private dispatchChangeHandlers(prev: FocusState, next: FocusState) {
        if (!this._host.hasFocusChangeHandler) return;

        const dispatch = (...[e, next]: Parameters<DomEvents["dispatchFocusEvent"]>) => {
            this._host._events.dispatchFocusEvent(e, next);
        };

        if (!prev.focus && next.focus) dispatch("focus", next);
        if (prev.focus && !next.focus) dispatch("blur", next);
        if (!prev.shallowFocus && next.shallowFocus) dispatch("shallowfocus", next);
        if (prev.shallowFocus && !next.shallowFocus) dispatch("shallowblur", next);
    }

    // ---UNUSED BUT WILL NEED TO BE IMPLEMENTED---
    // public focusNearestProvider() {
    //     if (this._nearestProvider) {
    //         this._nearestProvider.focused = true;
    //     }
    //     // NEED TO PROPAGATE CHANGES FROM NEARESTPROVIDER
    // }
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

        let parent: Provider | null = this.parent;
        while (parent) {
            if (!parent.focused) {
                return { focus: false, shallowFocus: true };
            }
            parent = parent.parent;
        }

        return { focus: true, shallowFocus: false };
    }
}
