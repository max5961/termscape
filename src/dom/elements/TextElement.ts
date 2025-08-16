import { DomElement } from "../DomElement.js";
import { type TTagNames } from "../../types.js";
import { type TextStyle, type VirtualStyle } from "../../style/Style.js";

export class TextElement extends DomElement {
    public textContent: string;
    // public style: TextStyle;
    public tagName: TTagNames;

    constructor(textContent: string = "") {
        super();
        this.tagName = "TEXT_ELEMENT";
        this.textContent = textContent;
        this.style = this.defaultStyles;
    }

    protected override defaultStyles: VirtualStyle = {};

    public setTextContent(text: string): void {
        this.textContent = text;
    }
}
