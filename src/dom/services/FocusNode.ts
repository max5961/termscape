export class FocusNode {
    public controller: FocusNodeController | undefined;
    public providesContext: boolean;
    public nearestProvider: FocusNode | undefined;
    public parent: FocusNode | undefined;
    public children: Set<FocusNode>;
    public focus: boolean;

    constructor() {
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

export class FocusNodeController extends FocusNode {
    public controlledNodes: Set<FocusNode>;
    public focused: FocusNode | undefined;

    constructor() {
        super();
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
        node.controller = undefined;
        this.controlledNodes.delete(node);
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
        this.focused = node;
        node.focus = true;
    }

    public blurNode(node: FocusNode) {
        if (!this.controlledNodes.has(node)) return;
        if (this.focused !== node) return;

        this.focused = undefined;
        node.focus = false;
    }
}
