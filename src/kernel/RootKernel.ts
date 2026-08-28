import type { Stdout } from "../Types.js";
import type { DomElement } from "./Kernel.js";
import { Kernel } from "./Kernel.js";
import { RealRoot } from "./RootEmulator.js";

export interface IRootKernel {
    scheduleRender(): void;
    readonly stdout: Stdout;
}

export class RootKernel extends Kernel implements IRootKernel {
    public override root: RealRoot;

    constructor(shell?: DomElement) {
        super(shell);
        this.root = new RealRoot(this);
    }

    public scheduleRender(): void {
        // this.scheduler.scheduleRender();
    }

    public get stdout() {
        // return this.runtime.stdout;
        return process.stdout;
    }
}
