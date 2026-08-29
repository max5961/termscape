import type { Stdout } from "../Types.js";
import type { DomElement } from "../dom/DomElement.js";
import { CoreElement } from "./CoreElement.js";
import { RealRoot } from "./RootEmulator.js";

export interface ICoreRootElement {
    scheduleRender(): void;
    readonly stdout: Stdout;
}

export class CoreRootElement extends CoreElement implements ICoreRootElement {
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
