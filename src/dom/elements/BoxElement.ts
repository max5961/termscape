import Yoga from "yoga-wasm-web/auto";
import { BoxStyle } from "./attributes/box/BoxStyle.js";
import { Stylers } from "../helpers/Stylers.js";
import { createStyleProxy } from "../archive/createStyleProxy.js";
import { DomElement } from "../DomElement.js";
import { Style, TTagNames } from "../../types.js";

export class BoxElement extends DomElement {
    public style: BoxStyle;
    public tagName: TTagNames;

    constructor() {
        super();
        this.tagName = "BOX_ELEMENT";
        this.style = this.proxyStyleObject();

        // Default styles
        this.node.setFlexWrap(Yoga.WRAP_NO_WRAP);
        this.node.setFlexDirection(Yoga.FLEX_DIRECTION_ROW);
        this.node.setFlexGrow(0);
        this.node.setFlexShrink(1);

        this.style.flexWrap = "nowrap";
        this.style.flexDirection = "row";
        this.style.flexGrow = 0;
        this.style.flexShrink = 1;
    }

    public setAttribute(): void {}

    protected applyStyle<T extends BoxStyle>(
        prop: keyof T,
        newValue: T[keyof T],
    ): unknown {
        const next = Stylers.Box[prop]?.(this.node, newValue);
        return next || newValue;
    }

    protected proxyStyleObject() {
        return createStyleProxy(
            {
                zIndex: 0,
                flexWrap: "nowrap",
                flexDirection: "row",
                flexGrow: 0,
                flexShrink: 1,
            } as BoxStyle,
            (prop, val) => {
                if (prop === "zIndex") {
                    if (typeof val === "number") {
                        this.style.zIndex = val;
                    } else {
                        this.style.zIndex = 0;
                    }
                }

                Stylers.Box[prop]?.(this.node, val);
            },
            () => {
                // if (this.isAttached) {
                //     this.scheduleRender({ resize: false });
                // }
            },
        );
    }
}
