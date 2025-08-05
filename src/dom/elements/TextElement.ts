import { DomElement } from "../DomElement.js";
import { TextStyle } from "./attributes/text/TextStyle.js";
import { Root } from "../Root.js";

export class TextElement extends DomElement {
    public textContent: string;
    public style: TextStyle;

    constructor(root: Root, textContent: string) {
        super(root, "TEXT_ELEMENT");
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
