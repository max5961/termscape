import { DomElement } from "../DomElement.js";
import { IntrinsicAttr } from "../../global.js";

export class TextElement extends DomElement {
    public textContent: string;

    constructor(textContent: string) {
        super();
        this.tagName === "TEXT_ELEMENT";
        this.textContent = textContent;
    }

    public setAttribute(): void {
        //
    }

    public addEventListener(): void {
        //
    }

    public setTextContent(text: string): void {
        this.textContent = text;
    }
}
