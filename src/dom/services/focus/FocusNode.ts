import type { FocusStatus } from "../../../Types.js";
import type { DomElement } from "../../DomElement.js";
import type { FocusControllerNode } from "./FocusControllerNode.js";

export const CONTROLLED_STATE = Symbol("termscape.focusnode_controlled_state");

export class FocusNode {
    /** State that can only be mutated through an instance of FocusControllerNode */
    public [CONTROLLED_STATE]: {
        controller: FocusControllerNode | undefined;
        providesContext: boolean;
        focus: boolean;
    };

    public get controller() {
        return this[CONTROLLED_STATE].controller;
    }
    public get providesContext() {
        return this[CONTROLLED_STATE].providesContext;
    }
    public get focus() {
        return this[CONTROLLED_STATE].focus;
    }

    public readonly host: DomElement;
    private readonly children: Set<FocusNode>;
    private nearestProvider: FocusNode | undefined;

    constructor(host: DomElement) {
        this[CONTROLLED_STATE] = {
            controller: undefined,
            providesContext: false,
            focus: true,
        };

        this.host = host;
        this.children = new Set();
    }

    public addChild(node: FocusNode) {
        this.children.add(node);

        const nearestProvider = this.providesContext ? this : this.nearestProvider;

        node.nearestProvider = nearestProvider;
        if (!node.providesContext) {
            node.rippleProviderChange(nearestProvider);
        }
    }
    public removeChild(child: FocusNode) {
        this.children.delete(child);
    }

    public rippleProviderChange(provider: FocusNode = this) {
        for (const child of this.children) {
            child.nearestProvider = provider;
            if (child.providesContext) continue;

            child.rippleProviderChange(provider);
        }
    }

    public rippleConsumerChange(
        nearestProvider: FocusNode | undefined = this.nearestProvider,
    ) {
        for (const child of this.children) {
            child.nearestProvider = nearestProvider;
            if (child.providesContext) continue;

            child.rippleConsumerChange(nearestProvider);
        }
    }

    public get status(): FocusStatus {
        if (!this.providesContext) {
            return (
                this.nearestProvider?.status ?? {
                    focus: true,
                    shallowFocus: false,
                }
            );
        }

        if (this.focus) {
            let parentProvider = this.nearestProvider;
            while (parentProvider?.focus) {
                parentProvider = parentProvider.nearestProvider;
            }

            if (parentProvider && !parentProvider.focus) {
                return { focus: false, shallowFocus: true };
            } else {
                return { focus: true, shallowFocus: false };
            }
        }

        return { focus: false, shallowFocus: false };
    }

    // TODO - we should bubble up requests on non providers to their nearest provider
    public focusSelf() {
        if (!this.controller) return;
        this.controller.focusControlledNode(this);
    }

    public blurSelf() {
        if (!this.controller) return;
        this.controller.blurControlledNode(this);
    }

    public dfs(cb: (node: FocusNode) => unknown, level = 0) {
        cb(this);
        for (const child of this.children) child.dfs(cb, level);
    }

    public onFocusChange() {
        this.dfs((focusNode) => {
            focusNode.host._virtual._recomputeStyleIfStyleHandlerExists();
        });
    }
}
