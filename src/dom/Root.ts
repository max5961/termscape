import Yoga from "yoga-wasm-web/auto";
import { RenderHooksManager } from "../render/RenderHooks.js";
import { EventEmitterMap, RuntimeConfig, TTagNames } from "../types.js";
import { DomElement } from "./DomElement.js";
import { Emitter, Stdin } from "../stdin/Stdin.js";
import { Runtime } from "./Runtime.js";
import { Scheduler } from "./Scheduler.js";
import { Renderer, WriteOpts } from "../render/Renderer.js";
import { Action } from "term-keymap";
import { Ansi } from "../util/Ansi.js";

export class Root extends DomElement {
    public tagName: TTagNames;
    public hooks: RenderHooksManager;
    public runtime: Runtime;
    public endRuntime: () => void;

    private stdin: Stdin;
    private scheduler: Scheduler;
    private renderer: Renderer;

    constructor(config: RuntimeConfig) {
        super();
        this.tagName = "ROOT_ELEMENT";
        this.node.setFlexWrap(Yoga.WRAP_NO_WRAP);
        this.node.setFlexDirection(Yoga.FLEX_DIRECTION_ROW);
        this.node.setFlexGrow(0);
        this.node.setFlexShrink(1);

        this.renderer = new Renderer(this);
        this.stdin = new Stdin(this);
        this.hooks = new RenderHooksManager(this.renderer.hooks);
        this.scheduler = new Scheduler();
        this.runtime = new Runtime(this, this.scheduler, this.stdin);

        this.configureRuntime(config);
        this.endRuntime = this.beginRuntime();
    }

    // Noop implementation in Root
    protected applyStyle(): void {}

    public configureRuntime(config: RuntimeConfig) {
        Object.entries(config).forEach(([key, val]) => {
            if (val !== undefined && key in this.runtime) {
                (this.runtime as any)[key] = val;
            }
        });
    }

    public getLayoutHeight() {
        return this.renderer.lastCanvas?.grid.length ?? 0;
    }

    public render(opts: WriteOpts = {}) {
        this.renderer.writeToStdout(opts);
    }

    public scheduleRender(opts: WriteOpts = {}) {
        this.scheduler.scheduleUpdate(() => {
            this.render(opts);
        });
    }

    public addKeyListener(action: Action): () => void {
        this.stdin.subscribe(action);
        return () => {
            this.stdin.remove(action);
        };
    }

    public removeKeyListener(action: Action): void {
        this.stdin.remove(action);
    }

    private beginRuntime() {
        return () => {};
    }

    public connectToInput() {
        this.stdin.listen();
        Emitter.on("MouseEvent", this.handleMouseEvent);

        return () => {
            this.runtime.stdout.write(Ansi.restoreFromKittyProtocol);
            this.stdin.pause();
            Emitter.off("MouseEvent", this.handleMouseEvent);
        };
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
