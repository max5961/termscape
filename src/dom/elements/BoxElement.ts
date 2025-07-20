import { BoxStyle } from "./attributes/box/BoxStyle.js";
import { DomElement, FriendDomElement } from "../DomElement.js";
import { Stylers } from "../helpers/Stylers.js";
import { IntrinsicAttr } from "../../global.js";
import { TTagNames } from "../dom-types.js";

export class BoxElement extends DomElement {
    constructor() {
        super();
        this.tagName = "BOX_ELEMENT";
    }

    public setAttribute(): void {
        //
    }
    public addEventListener(): void {}
}
