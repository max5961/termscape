import { CoreElement } from "../core/CoreElement.js";
import { DefaultStyles } from "./DefaultStyles.js";
import { DomElement } from "./DomElement.js";
import type { DomStyle } from "./types.js";

export class BoxElement extends DomElement<DomStyle.Box> {
    protected override readonly _core: CoreElement;

    constructor() {
        super();
        this._core = new CoreElement(this, DefaultStyles.Box);
    }
}
