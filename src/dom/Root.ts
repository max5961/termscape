import Yoga from "yoga-wasm-web/auto";
import EventEmitter from "events";
import { RenderHooksManager } from "../render/RenderHooks.js";
import { DomElement } from "./DomElement.js";
import { Scheduler } from "./Scheduler.js";
import { Renderer, type WriteOpts } from "../render/Renderer.js";
import { createRuntime, type Runtime } from "./RuntimeFactory.js";
import { type EventEmitterMap, type RuntimeConfig, type TTagNames } from "../types.js";
import { type Action } from "term-keymap";

export const Emitter = new EventEmitter<EventEmitterMap>();

export class Root extends DomElement {
    public tagName: TTagNames;
    public hooks: RenderHooksManager;
    public runtime: Runtime["api"];

    protected override readonly rootRef: { readonly root: Root };

    private scheduler: Scheduler;
    private renderer: Renderer;
    private handleRuntime: Runtime["logic"];
    private Emitter: EventEmitter<EventEmitterMap>;
    private exitPromiseResolvers: (() => void)[];

    constructor(config: RuntimeConfig) {
        super();
        this.tagName = "ROOT_ELEMENT";
        this.rootRef = { root: this };

        this.node.setFlexWrap(Yoga.WRAP_NO_WRAP);
        this.node.setFlexDirection(Yoga.FLEX_DIRECTION_ROW);
        this.node.setFlexGrow(0);
        this.node.setFlexShrink(1);

        this.renderer = new Renderer(this);
        this.hooks = new RenderHooksManager(this.renderer.hooks);
        this.scheduler = new Scheduler();

        this.Emitter = new EventEmitter();
        this.Emitter.on("MouseEvent", this.handleMouseEvent);

        const { api, logic } = createRuntime({
            config: config,
            root: this,
            scheduler: this.scheduler,
            emitter: this.Emitter,
        });

        this.runtime = api;
        this.handleRuntime = logic;

        this.exitPromiseResolvers = [];
    }

    public exit() {
        this.handleRuntime.endRuntime();
        this.exitPromiseResolvers.forEach((res) => res());
        this.exitPromiseResolvers = [];
    }

    // ** Promise resolves when execution  */
    public run() {
        return new Promise<void>((res) => {
            this.exitPromiseResolvers.push(() => res());
        });
    }

    public getLayoutHeight() {
        return this.renderer.lastCanvas?.grid.length ?? 0;
    }

    public render(opts: WriteOpts = {}) {
        if (!opts.skipCalculateLayout) {
            this.node.calculateLayout(
                process.stdout.columns,
                undefined,
                Yoga.DIRECTION_LTR,
            );
        }
        this.renderer.writeToStdout(opts);
    }

    public scheduleRender(opts: WriteOpts = {}) {
        this.scheduler.scheduleUpdate(() => {
            this.render(opts);
        });
    }

    public listenStdin() {
        this.handleRuntime.resumeStdin();
    }

    public override addKeyListener(action: Action): () => void {
        // Anytime a key listener is added it should prompt opening stdin stream.
        // `listenStdin` does nothing if already listening.
        this.listenStdin();
        this.handleRuntime.addKeyListener(action);
        return () => {
            this.handleRuntime.removeKeyListener(action);
        };
    }

    public override removeKeyListener(action: Action): void {
        this.handleRuntime.removeKeyListener(action);
    }

    private handleMouseEvent: (...args: EventEmitterMap["MouseEvent"]) => unknown = (
        x,
        y,
        type,
    ) => {
        const element = this.renderer.rects.findTargetElement(x, y);
        if (!element) return;

        this.propagateMouseEvent(x, y, type, element);
    };
}
