import { CoreRootElement } from "../core/CoreRootElement.js";
import { DomElement } from "./DomElement.js";
import type { RuntimeOptions, RuntimeSetup } from "../core/runtime/Runtime.js";
import type { DomStyle } from "./types.js";

interface IRootElement {
    readonly runtime: RuntimeOptions;
}

export class RootElement extends DomElement<DomStyle.Box> implements IRootElement {
    protected override readonly _core: CoreRootElement;

    constructor(setup: RuntimeSetup) {
        super();
        this._core = new CoreRootElement(this, setup);
    }

    public get runtime() {
        return this._core.runtimeControl;
    }
}
