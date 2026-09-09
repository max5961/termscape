import type { ProcessLike, StdinLike, StdoutLike } from "../Types.js";
import type { StateChange } from "./renderer/RenderStateChange.js";
import type { CoreRootElement } from "./CoreRootElement.js";
import type { Action } from "term-keymap";
import type { CoreElement } from "./CoreElement.js";

export interface IActions {
    addAction(action: Action): void;
    removeAction(action: Action): void;
}

export interface IRootEmulator extends IActions {
    readonly process: ProcessLike;
    readonly stdin: StdinLike;
    readonly stdout: StdoutLike;
    scheduleRender(change: StateChange): void;
}

export class RootEmulator implements IRootEmulator {
    protected root: CoreRootElement | undefined;
    protected readonly core: CoreElement;
    private readonly localActions: Set<Action>;

    constructor(core: CoreElement) {
        this.core = core;
        this.localActions = new Set();
    }

    public getAttachedRoot() {
        return this.root;
    }

    public onAttach(root: CoreRootElement) {
        this.root = root;
        if (this.localActions.size) {
            root.runtime.requestStdinStream();
            this.localActions.forEach((action) => root.addAction(action));
        }
    }

    public onDetach(root: CoreRootElement) {
        this.root = undefined;
        this.core.canvas = undefined;
        if (this.localActions.size) {
            this.localActions.forEach((action) => root.removeAction(action));
        }
    }

    get process() {
        return this.root?.process ?? process;
    }
    get stdout() {
        return this.root?.stdout ?? process.stdout;
    }
    get stdin() {
        return this.root?.stdin ?? process.stdin;
    }

    public scheduleRender(change: StateChange): void {
        if (this.root) {
            this.root.scheduleRender(change);
        }
    }

    public addAction(action: Action): void {
        this.localActions.add(action);
        this.root?.addAction(action);
    }

    public removeAction(action: Action): void {
        this.localActions.delete(action);
        this.root?.removeAction(action);
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
