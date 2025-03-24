import { BoxStyle } from "./attributes/box/BoxStyle.js";
import { DomElement } from "../DomElement.js";
import { Stylers } from "../helpers/Stylers.js";
import { IntrinsicAttr } from "../../global.js";

export class BoxElement extends DomElement {
    constructor() {
        super();
        this.tagname = "BOX_ELEMENT";
    }

    public setAttributes(attr: IntrinsicAttr["Box"]): void {
        const { props, metadata } = attr;

        // Apply Yoga styles to YogaNode
        if (props.style) {
            for (const [k, v] of Object.entries(props.style)) {
                Stylers.Box[k as keyof BoxStyle]?.(this.node, v);
            }
        }

        this.props = props;
        this.metadata = metadata;
    }

    public addEventListener(): void {
        //
    }
}
