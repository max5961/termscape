import type { Props } from "../Props.js";
import type { CanvasStyle } from "../style/Style.js";
import { DomElement } from "./DomElement.js";
import { TagNameEnum } from "../Constants.js";

export class CanvasElement extends DomElement<{
    Style: CanvasStyle;
    Props: Props.Canvas;
}> {
    constructor() {
        super();
    }

    public override get tagName(): typeof TagNameEnum.Canvas {
        return "canvas";
    }

    protected override get defaultProps(): Props.Canvas {
        return { draw: (_pen) => {} };
    }

    protected override get defaultStyles(): CanvasStyle {
        return {};
    }
}
