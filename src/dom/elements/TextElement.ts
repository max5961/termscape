import { TTagNames } from "../dom-types.js";
import { DomElement } from "../DomElement.js";
import { TextStyle } from "./attributes/text/TextStyle.js";

export class TextElement extends DomElement {
    public textContent: string;
    public style: TextStyle;
    public tagName: TTagNames;

    constructor(textContent: string) {
        super();
        this.tagName = "TEXT_ELEMENT";
        this.textContent = textContent;
        this.style = {} as TextStyle;
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
