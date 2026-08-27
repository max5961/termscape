import type { IRootKernel, RootKernel } from "./RootKernel.js";

export class RootEmulator implements IRootKernel {
    protected root: RootKernel | undefined;

    public getKernel() {
        return this.root;
    }

    public onAttach(root: RootKernel) {
        this.root = root;
    }

    public onDetach(_root: RootKernel) {
        this.root = undefined;
    }

    public scheduleRender(): void {
        if (this.root) {
            this.root.scheduleRender();
        }
    }
}

export class RealRoot extends RootEmulator {
    protected override readonly root: RootKernel;

    constructor(root: RootKernel) {
        super();
        this.root = root;
    }
}
