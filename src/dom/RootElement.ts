import { CoreRootElement } from "../core/CoreRootElement.js";
import { DomElement } from "./DomElement.js";
import type { IRuntime } from "../core/runtime/Runtime.js";
import type { DomStyle } from "./types.js";
import type { CreateCore } from "../Types.js";

interface IRootElement {
    readonly runtime: IRuntime;
}

export class RootElement extends DomElement<DomStyle.Box> implements IRootElement {
    protected override readonly _core: CoreRootElement;
    private readonly _runtimeController: IRuntime;

    constructor(createCore: CreateCore<CoreRootElement>) {
        super();
        this._core = createCore(this);
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
