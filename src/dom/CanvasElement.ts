import { DomElement } from "./DomElement.js";
import { ElementIdentities } from "../Constants.js";
import type { Props } from "./props/Props.js";
import type { Style } from "./style/Style.js";
import { DefaultStyles } from "./style/DefaultStyles.js";

export class CanvasElement extends DomElement<{
    Style: Style.Canvas;
    Props: Props.Canvas;
}> {
    protected override readonly identities = ElementIdentities.CanvasElement;

    constructor() {
        super(DefaultStyles.Canvas);
    }
}
