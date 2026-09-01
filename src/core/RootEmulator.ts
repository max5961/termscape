import type { StdoutLike } from "../Types.js";
import type { CoreRootElement } from "./CoreRootElement.js";

export interface IRootEmulator {
    scheduleRender(): void;
    readonly stdout: StdoutLike;
}

export class RootEmulator implements IRootEmulator {
    protected root: CoreRootElement | undefined;

    public getAttachedRoot() {
        return this.root;
    }

    public onAttach(root: CoreRootElement) {
        this.root = root;
    }

    public onDetach(_root: CoreRootElement) {
        this.root = undefined;
        // should be either using events or subscribing detach cbs here
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
