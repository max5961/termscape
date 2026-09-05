import { CoreRootElement, type RuntimeSetup } from "../core/CoreRootElement.js";
import { DomElement } from "./DomElement.js";
import type { RuntimeControl } from "../core/runtime/Runtime.js";
import type { DomStyle } from "./types.js";

interface IRootElement {
    readonly runtime: RuntimeControl;
}

export class RootElement extends DomElement<DomStyle.Box> implements IRootElement {
    protected override readonly _core: CoreRootElement;
    private readonly _runtimeController: RuntimeControl;

    constructor(setup: RuntimeSetup) {
        super();
        this._core = new CoreRootElement(this, setup);
        this._runtimeController = this._core.runtime.createController();
    }

    public get runtime() {
        return this._runtimeController;
    }

    public start() {
        return this._core.runtime.startRuntime();
    }

    public exit() {
        return this._core.runtime.endRuntime();
    }
}
