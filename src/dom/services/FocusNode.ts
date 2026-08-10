import type { DomElement } from "../DomElement.js";
import type { FocusNodeController } from "./FocusNodeController.js";

export class FocusNode {
    public controller: FocusNodeController | undefined;
    public providesContext: boolean;
    public nearestProvider: FocusNode | undefined;
    public parent: FocusNode | undefined;
    public children: Set<FocusNode>;
    public focus: boolean;
    public readonly host: DomElement;

    constructor(host: DomElement) {
        this.host = host;
        this.providesContext = false;
        this.nearestProvider = undefined;
        this.parent = undefined;
        this.focus = true;
        this.children = new Set();
    }

    public addChild(node: FocusNode) {
        this.children.add(node);

        const nearestProvider = this.providesContext ? this : this.nearestProvider;

        node.nearestProvider = nearestProvider;
        if (!node.providesContext) {
            node.propagateProviderChange(nearestProvider);
        }
    }
    public removeChild(child: FocusNode) {
        this.children.delete(child);
        this.parent = undefined;
    }

    public propagateProviderChange(provider: FocusNode = this) {
        for (const child of this.children) {
            child.nearestProvider = provider;
            if (child.providesContext) continue;

            child.propagateProviderChange(provider);
        }
    }

    public rippleConsumerChanges(
        nearestProvider: FocusNode | undefined = this.nearestProvider,
    ) {
        for (const child of this.children) {
            child.nearestProvider = nearestProvider;
            if (child.providesContext) continue;

            child.rippleConsumerChanges(nearestProvider);
        }
    }

    public get status(): { focus: boolean; shallow: boolean } {
        if (!this.providesContext) {
            return (
                this.nearestProvider?.status ?? {
                    focus: true,
                    shallow: false,
                }
            );
        }

        if (this.focus) {
            let parentProvider = this.nearestProvider;
            while (parentProvider?.focus) {
                parentProvider = parentProvider.nearestProvider;
            }

            if (parentProvider && !parentProvider.focus) {
                return { focus: false, shallow: true };
            } else {
                return { focus: true, shallow: false };
            }
        }

        return { focus: false, shallow: false };
    }

    public focusSelf() {
        if (!this.controller) {
            this.focus = true;
            return;
        }

        this.controller.focusNode(this);
    }

    public blurSelf() {
        if (!this.controller) return;
        this.controller.blurNode(this);
    }

    public dfs(cb: (node: FocusNode) => unknown, level = 0) {
        cb(this);
        for (const child of this.children) child.dfs(cb, level);
    }
}
