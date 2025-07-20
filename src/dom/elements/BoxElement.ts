import Yoga from "yoga-wasm-web/auto";
import { DomElement } from "../DomElement.js";
import { BoxStyle } from "./attributes/box/BoxStyle.js";
import { Root } from "../Root.js";
import { Stylers } from "../helpers/Stylers.js";
import { TTagNames } from "../dom-types.js";
import { createStyleProxy } from "../createStyleProxy.js";

export class BoxElement extends DomElement {
    public tagName: TTagNames;
    public style: BoxStyle;

    constructor() {
        super();
        this.tagName = "BOX_ELEMENT";
        this.style = createStyleProxy(
            {
                zIndex: 0,
                flexWrap: "nowrap",
                flexDirection: "row",
                flexGrow: 0,
                flexShrink: 1,
            } as BoxStyle,
            (prop, val) => {
                Stylers.Box[prop]?.(this.node, val);
            },
            Root.current.scheduleRender,
        );

        // Default Yoga styles
        this.node.setFlexWrap(Yoga.WRAP_NO_WRAP);
        this.node.setFlexDirection(Yoga.FLEX_DIRECTION_ROW);
        this.node.setFlexGrow(0);
        this.node.setFlexShrink(1);
    }

    public setAttribute(): void {
        //
    }
    public addEventListener(): void {}
}
