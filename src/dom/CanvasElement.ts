import type { Props } from "../Props.js";
import type { CanvasStyle } from "../style/Style.js";
import { DomElement } from "./DomElement.js";

export class CanvasElement extends DomElement<{
    Style: CanvasStyle;
    Props: Props.Canvas;
}> {
    public override tagName: "CANVAS_ELEMENT";

    constructor() {
        super();
        this.tagName = "CANVAS_ELEMENT";
    }

    protected override get defaultProps(): Props.Canvas {
        return { draw: (_pen) => {} };
    }

    protected override get defaultStyles(): CanvasStyle {
        return {};
    }
}
