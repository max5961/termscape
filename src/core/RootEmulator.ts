import type { CoreRootEvents, ProcessLike, StdinLike, StdoutLike } from "../Types.js";
import type { StateChange } from "./renderer/RenderStateChange.js";
import type { CoreRootElement } from "./CoreRootElement.js";
import type { Action } from "term-keymap";
import type { CoreElement } from "./CoreElement.js";
import type { EventsCallback } from "./Events.js";

/* eslint-disable @typescript-eslint/no-unsafe-function-type */

export interface IActions {
    addAction(action: Action): void;
    removeAction(action: Action): void;
}

export interface IHooks {
    on<K extends keyof CoreRootEvents>(
        event: K,
        cb: EventsCallback<K, CoreRootEvents>,
    ): void;
    off<K extends keyof CoreRootEvents>(
        event: K,
        cb: EventsCallback<K, CoreRootEvents>,
    ): void;
}

export interface IRootEmulator extends IActions, IHooks {
    readonly process: ProcessLike;
    readonly stdin: StdinLike;
    readonly stdout: StdoutLike;
    scheduleRender(change: StateChange): void;
}

export class RootEmulator implements IRootEmulator {
    protected root: CoreRootElement | undefined;
    protected readonly core: CoreElement;
    private readonly localActions: Set<Action>;
    private readonly localHooks: Map<string, Set<Function>>;

    constructor(core: CoreElement) {
        this.core = core;
        this.localActions = new Set();
        this.localHooks = new Map();
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
        if (this.localHooks.size) {
            this.attachLocalHooks(root);
        }
    }

    public onDetach(root: CoreRootElement) {
        this.root = undefined;
        this.core.canvas = undefined;
        if (this.localActions.size) {
            this.localActions.forEach((action) => root.removeAction(action));
        }
        if (this.localHooks.size) {
            this.detachLocalHooks(root);
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

    public on<K extends keyof CoreRootEvents>(
        event: K,
        cb: EventsCallback<K, CoreRootEvents>,
    ): void {
        this.root?.on(event, cb);

        if (!this.localHooks.has(event)) {
            this.localHooks.set(event, new Set());
        }
        this.localHooks.get(event)!.add(cb);
    }

    public off<K extends keyof CoreRootEvents>(
        event: K,
        cb: EventsCallback<K, CoreRootEvents>,
    ): void {
        this.root?.off(event, cb);

        if (!this.localHooks.has(event)) return;

        const set = this.localHooks.get(event)!;
        set.delete(cb);
        if (!set.size) {
            this.localHooks.delete(event);
        }
    }

    private attachLocalHooks(root: CoreRootElement) {
        const keys = this.localHooks.keys();
        for (const k of keys) {
            const set = this.localHooks.get(k)!;
            set.forEach((cb) => root.on(k as any, cb as any));
        }
    }

    private detachLocalHooks(root: CoreRootElement) {
        const keys = this.localHooks.keys();
        for (const k of keys) {
            const set = this.localHooks.get(k)!;
            set.forEach((cb) => root.off(k as any, cb as any));
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
