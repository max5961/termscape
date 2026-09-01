import { DefaultStyles } from "../dom/DefaultStyles.js";
import type { DomElement } from "../dom/DomElement.js";
import { CoreElement } from "./CoreElement.js";
import { RealRoot, type IRootEmulator } from "./RootEmulator.js";
import { RootCanvas } from "./canvas/RootCanvas.js";
import { Renderer } from "./renderer/Renderer.js";
import { Runtime, type RuntimeSetup } from "./runtime/Runtime.js";

export class CoreRootElement extends CoreElement implements IRootEmulator {
    public override readonly root: RealRoot;
    public override readonly canvas: RootCanvas;
    public readonly renderer: Renderer;
    public readonly runtime: Runtime;
    public readonly runtimeControl: ReturnType<Runtime["createController"]>;

    constructor(shell: DomElement, setup: RuntimeSetup) {
        super(shell, DefaultStyles.Root);
        this.root = new RealRoot(this);
        this.runtime = new Runtime(this, setup);
        this.runtimeControl = this.runtime.createController();
        this.canvas = new RootCanvas(this);
        this.renderer = new Renderer(this);

        if (setup.startOnCreate) {
            this.runtime.startRuntime();
        }
    }

    public scheduleRender(): void {
        // this.scheduler.scheduleRender(this.render);
    }

    public get stdout() {
        return this.runtimeControl.stdout;
    }
}
