import { BoxProps } from "../props/box/BoxProps.js";
import { TextProps } from "../props/text/TextProps.js";
import { DomElement } from "./DomElement.js";

export class Root extends DomElement {
    constructor() {
        super();
        this.isRoot = true;
    }

    public setProps(props: BoxProps | TextProps): void {
        //
    }

    public addEventListener(): void {
        //
    }
}
