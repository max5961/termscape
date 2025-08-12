import Yoga from "yoga-wasm-web/auto";
import { DomElement } from "../DomElement.js";
import type { TTagNames } from "../../types.js";

export class BoxElement extends DomElement {
    // public style: BoxStyle;
    public tagName: TTagNames;

    constructor() {
        super();
        this.tagName = "BOX_ELEMENT";

        // Default styles
        this.node.setFlexWrap(Yoga.WRAP_NO_WRAP);
        this.node.setFlexDirection(Yoga.FLEX_DIRECTION_ROW);
        this.node.setFlexGrow(0);
        this.node.setFlexShrink(1);

        this.style = {};
        this.style.flexWrap = "nowrap";
        this.style.flexDirection = "row";
        this.style.flexGrow = 0;
        this.style.flexShrink = 1;
    }

    public setAttribute(): void {}
}
