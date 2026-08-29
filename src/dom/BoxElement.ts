import { DefaultStyles } from "./DefaultStyles.js";
import { DomElement } from "./DomElement.js";
import type { DomStyle } from "./types.js";

export class BoxElement extends DomElement<DomStyle.Box> {
    constructor() {
        super(DefaultStyles.Box);
    }
}
