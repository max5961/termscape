import { BoxProps } from "../../props/box/BoxProps.js";
import { DomElement } from "../DomElement.js";
import { SetProps } from "../SetProps.js";

export class BoxElement extends DomElement {
    constructor() {
        super();
        this.tagname = "BOX_ELEMENT";
    }

    public setProps(props: BoxProps): void {
        for (const key in props) {
            const k = key as keyof BoxProps;
            SetProps.Box[k]?.(this.node, props[k]);
        }
    }

    public addEventListener(): void {
        //
    }
}
