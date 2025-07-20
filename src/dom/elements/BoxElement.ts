import { DomElement } from "../DomElement.js";

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

const box = new BoxElement();
