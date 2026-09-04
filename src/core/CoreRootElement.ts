import type { Action } from "term-keymap";
import { DefaultStyles } from "../dom/DefaultStyles.js";
import type { DomElement } from "../dom/DomElement.js";
import { CoreElement } from "./CoreElement.js";
import { RealRoot, type IRootEmulator } from "./RootEmulator.js";
import { Scheduler } from "./Scheduler.js";
import { RootCanvas } from "./canvas/RootCanvas.js";
import { StateChange } from "./renderer/RenderStateChange.js";
import { Renderer } from "./renderer/Renderer.js";
import { Runtime, type RuntimeSetup } from "./runtime/Runtime.js";

export class CoreRootElement extends CoreElement implements IRootEmulator {
    public override readonly root: RealRoot;
    public override readonly canvas: RootCanvas;
    public readonly renderer: Renderer;
    public readonly runtime: Runtime;
    public readonly runtimeControl: ReturnType<Runtime["createController"]>;
    private readonly scheduler: Scheduler;

    constructor(shell: DomElement, setup: RuntimeSetup) {
        super(shell, DefaultStyles.Root);
        this.root = new RealRoot(this);
        this.runtime = new Runtime(this, setup);
        this.runtimeControl = this.runtime.createController();
        this.canvas = new RootCanvas(this);
        this.renderer = new Renderer(this);
        this.scheduler = new Scheduler(this, this.renderer.render);

        if (setup.startOnCreate ?? true) {
            this.runtime.startRuntime();
        }
    }

    public scheduleRender(change: StateChange): void {
        this.scheduler.scheduleRender(change);
    }

    public get stdout() {
        return this.runtimeControl.stdout;
    }

    public get stdin() {
        return this.runtimeControl.stdin;
    }

    public get process() {
        return this.runtimeControl.process;
    }

    public handleResize = () => {
        this.canvas.updateRootConstraints();
        this.scheduler.scheduleRender(StateChange.Resize);
    };

    public handleCapturedOutput = (data: string) => {
        this.renderer.pushCapturedOutput(data);
        this.scheduler.scheduleRender();
    };

    public exit = () => {
        this.runtime.endRuntime();
    };

    public getLayoutHeight() {
        return this.renderer.layoutHeight;
    }

    public addAction(action: Action): void {
        this.runtime.requestStdinStream();
        this.runtime.stdinProcessor.addAction(action);
    }

    public removeAction(action: Action): void {
        this.runtime.stdinProcessor.removeAction(action);
    }
}
