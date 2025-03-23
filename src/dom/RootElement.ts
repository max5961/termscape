import { BoxProps } from "../props/box/BoxProps.js";
import { BoxStyle } from "../props/box/BoxStyle.js";
import { TextProps } from "../props/text/TextProps.js";
import { TextStyle } from "../props/text/TextStyle.js";
import { DomElement } from "./DomElement.js";

export class RootElement extends DomElement {
    constructor() {
        super();
        this.isRoot = true;
    }

    public setProps(props: BoxProps | TextProps): void {
        //
    }

    public setStyle(style: BoxStyle | TextStyle): void {
        //
    }

    public addEventListener(): void {
        //
    }
}
