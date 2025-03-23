import { BoxStyle } from "../../props/box/BoxStyle.js";
import { DomElement } from "../DomElement.js";
import { SetStyle } from "../SetStyle.js";

export class BoxElement extends DomElement {
    constructor() {
        super();
        this.tagname = "BOX_ELEMENT";
    }

    public setStyle(style: BoxStyle): void {
        // Is it necessary to handle it this way? Or can you flip it so that you
        // iterate over the style argument.  This way should ensure that diffed
        // props are reset to default when they change to undefined
        for (const [key, handle] of Object.entries(SetStyle.Box)) {
            // value could be undefined, in which case it resets the style to default
            const value = style[key as keyof BoxStyle];
            handle(this.node, value);
        }

        // Should actually be handled like this.  However, the diffing function
        // must ensure that undefined properties are keys in the object so that
        // they can be iterated over and props can be reset
        // for (const [k, v] of Object.entries(style)) {
        //     SetStyle.Box[k as keyof BoxStyle]?.(this.node, v);
        // }
    }

    public setProps(props: any): void {
        this.props = props;
    }

    public addEventListener(): void {
        //
    }
}
