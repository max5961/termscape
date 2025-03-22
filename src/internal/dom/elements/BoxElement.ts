import { BoxStyle } from "../../props/box/BoxStyle.js";
import { DomElement } from "../DomElement.js";
import { SetProps } from "../SetProps.js";

export class BoxElement extends DomElement {
    constructor() {
        super();
        this.tagname = "BOX_ELEMENT";
    }

    public setProps(props: any): void {
        for (const key in props) {
            const k = key as keyof BoxStyle;
            SetProps.Box[k]?.(this.node, props[k]);
        }
    }

    public addEventListener(): void {
        //
    }
}
