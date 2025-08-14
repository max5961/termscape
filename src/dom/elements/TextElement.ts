import { DomElement } from "../DomElement.js";
import { type TTagNames } from "../../types.js";
import { type TextStyle } from "../../style/Style.js";

export class TextElement extends DomElement {
    public textContent: string;
    // public style: TextStyle;
    public tagName: TTagNames;

    constructor(textContent: string = "") {
        super();
        this.tagName = "TEXT_ELEMENT";
        this.textContent = textContent;
        this.style = {} as TextStyle;
    }

    public setAttribute(): void {
        //
    }

    public setTextContent(text: string): void {
        this.textContent = text;
    }
}
