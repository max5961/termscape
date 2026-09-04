import type { Action } from "term-keymap";
import type { CoreElement } from "./CoreElement.js";
import type { CoreRootElement } from "./CoreRootElement.js";

export interface IActions {
    addAction(action: Action): void;
    removeAction(action: Action): void;
}

export class ActionStore implements IActions {
    private core: CoreElement;
    private store: Set<Action>;

    constructor(core: CoreElement) {
        this.core = core;
        this.store = new Set();
    }

    public addAction(action: Action) {
        this.store.add(action);
        this.core.root.addAction(action);
    }

    public removeAction(action: Action) {
        this.store.delete(action);
        this.core.root.removeAction(action);
    }

    public detachRootActions(root: CoreRootElement) {
        if (!this.store.size) return;
        this.store.forEach((action) => {
            root.removeAction(action);
        });
    }

    public attachRootActions(root: CoreRootElement) {
        if (!this.store.size) return;
        root.runtime.requestStdinStream();
        this.store.forEach((action) => {
            root.addAction(action);
        });
    }
}
