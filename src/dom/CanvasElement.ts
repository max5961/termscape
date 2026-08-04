import { DomElement } from "./DomElement.js";
import { TagNameEnum, CANVAS_ELEMENT } from "../Constants.js";
import type { Props } from "./props/Props.js";
import type { Style } from "./style/Style.js";
import { DefaultStyles } from "./style/DefaultStyles.js";

export class CanvasElement extends DomElement<{
    Style: Style.Canvas;
    Props: Props.Canvas;
}> {
    protected static override identity = CANVAS_ELEMENT;

    constructor() {
        super(DefaultStyles.Canvas);
    }

    public override get tagName(): typeof TagNameEnum.Canvas {
        return "canvas";
    }
}
