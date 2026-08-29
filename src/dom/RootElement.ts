import { DefaultStyles } from "./DefaultStyles.js";
import { DomElement } from "./DomElement.js";
import type { DomStyle } from "./types.js";

interface IRootElement {
    readonly runtime: any;
}

export class RootElement extends DomElement<DomStyle.Box> implements IRootElement {
    constructor() {
        super(DefaultStyles.Root);
    }

    public get runtime() {
        return "foo-runtime";
    }
}
