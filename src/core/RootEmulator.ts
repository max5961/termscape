import type { ICoreRootElement, CoreRootElement } from "./CoreRootElement.js";

export class RootEmulator implements ICoreRootElement {
    protected root: CoreRootElement | undefined;

    public getReference() {
        return this.root;
    }

    public onAttach(root: CoreRootElement) {
        this.root = root;
    }

    public onDetach(_root: CoreRootElement) {
        this.root = undefined;
    }

    public scheduleRender(): void {
        if (this.root) {
            this.root.scheduleRender();
        }
    }

    get stdout() {
        return this.root?.stdout ?? process.stdout;
    }
}

export class RealRoot extends RootEmulator {
    protected override readonly root: CoreRootElement;

    constructor(root: CoreRootElement) {
        super();
        this.root = root;
    }
}
