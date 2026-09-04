import type { StdoutLike } from "../Types.js";
import type { StateChange } from "./renderer/RenderStateChange.js";
import type { CoreRootElement } from "./CoreRootElement.js";
import type { Action } from "term-keymap";
import type { IActions } from "./ActionStore.js";
import type { CoreElement } from "./CoreElement.js";

export interface IRootEmulator extends IActions {
    readonly stdout: StdoutLike;
    scheduleRender(change: StateChange): void;
}

export class RootEmulator implements IRootEmulator {
    protected root: CoreRootElement | undefined;
    protected readonly core: CoreElement;

    constructor(core: CoreElement) {
        this.core = core;
    }

    public getAttachedRoot() {
        return this.root;
    }

    public onAttach(root: CoreRootElement) {
        this.root = root;
        this.core.actions.attachRootActions(root);
    }

    public onDetach(root: CoreRootElement) {
        this.root = undefined;
        this.core.actions.detachRootActions(root);
        this.core.canvas = undefined;
    }

    get stdout() {
        return this.root?.stdout ?? process.stdout;
    }

    public scheduleRender(change: StateChange): void {
        if (this.root) {
            this.root.scheduleRender(change);
        }
    }

    public addAction(action: Action): void {
        if (this.root) {
            this.root.addAction(action);
        }
    }

    public removeAction(action: Action): void {
        if (this.root) {
            this.root.removeAction(action);
        }
    }
}

export class RealRoot extends RootEmulator {
    protected override readonly root: CoreRootElement;
    protected declare readonly core: CoreRootElement;

    constructor(core: CoreRootElement) {
        super(core);
        this.root = core;
    }
}
