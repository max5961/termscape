import type { Action, MouseEvent } from "term-keymap";
import { DefaultStyles } from "../dom/DefaultStyles.js";
import type { DomElement } from "../dom/DomElement.js";
import { CoreElement } from "./CoreElement.js";
import { RealRoot, type IRootEmulator } from "./RootEmulator.js";
import { Scheduler } from "./Scheduler.js";
import { RootCanvas } from "./canvas/RootCanvas.js";
import { StateChange } from "./renderer/RenderStateChange.js";
import { Renderer } from "./renderer/Renderer.js";
import { Runtime, type IRuntime } from "./runtime/Runtime.js";
import { Events, type EventsCallback } from "./Events.js";
import type { CoreRootEvents } from "../Types.js";

export type RuntimeSetup = Partial<IRuntime & { startOnCreate: boolean }>;

export class CoreRootElement extends CoreElement implements IRootEmulator {
    public override readonly root: RealRoot;
    public override readonly canvas: RootCanvas;
    public readonly renderer: Renderer;
    public readonly runtime: Runtime;
    public readonly hooks: Events<CoreRootEvents>;
    private readonly scheduler: Scheduler;

    constructor(shell: DomElement, setup: RuntimeSetup) {
        super(shell, DefaultStyles.Root);
        this.root = new RealRoot(this);
        this.runtime = new Runtime(this, setup);
        this.canvas = new RootCanvas(this);
        this.renderer = new Renderer(this);
        this.hooks = new Events<CoreRootEvents>();
        this.scheduler = new Scheduler(this, this.renderer.render);

        if (setup.startOnCreate ?? true) {
            this.runtime.startRuntime();
        }
    }

    public exit = () => {
        this.runtime.endRuntime();
    };

    public getLayoutHeight() {
        return this.renderer.layoutHeight;
    }

    public handleResize = () => {
        this.canvas.updateRootConstraints();
        this.scheduler.scheduleRender(StateChange.Resize);
    };

    public handleCapturedOutput = (data: string) => {
        this.renderer.pushCapturedOutput(data);
        this.scheduler.scheduleRender();
    };

    /** TODO */
    public dispatchMouseEvent(_e: MouseEvent) {
        // logger.write({ mouseevent: _e });
    }

    // ***** EMULATOR METHODS *****

    public get stdout() {
        return this.runtime.stdout;
    }

    public get stdin() {
        return this.runtime.stdin;
    }

    public get process() {
        return this.runtime.process;
    }

    public scheduleRender(change: StateChange): void {
        this.scheduler.scheduleRender(change);
    }

    public addAction(action: Action): void {
        this.runtime.requestStdinStream();
        this.runtime.stdinProcessor.addAction(action);
    }

    public removeAction(action: Action): void {
        this.runtime.stdinProcessor.removeAction(action);
    }

    public on<K extends keyof CoreRootEvents>(
        event: K,
        cb: EventsCallback<K, CoreRootEvents>,
    ): void {
        this.hooks.addMulti(event, cb);
    }

    public off<K extends keyof CoreRootEvents>(
        event: K,
        cb: EventsCallback<K, CoreRootEvents>,
    ): void {
        this.hooks.deleteMulti(event, cb);
    }
}
