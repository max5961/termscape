import { Kernel } from "./Kernel.js";
import { RealRoot } from "./RootEmulator.js";

export interface IRootKernel {
    scheduleRender(): void;
}

export class RootKernel extends Kernel implements IRootKernel {
    public override root: RealRoot;

    constructor() {
        super();
        this.root = new RealRoot(this);
    }

    public scheduleRender(): void {
        //
    }
}
