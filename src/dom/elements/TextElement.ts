import { TextStyle } from "./attributes/text/TextStyle.js";
import { DomElement } from "../DomElement.js";
import { Style, TTagNames } from "../../types.js";

export class TextElement extends DomElement {
    public textContent: string;
    public style: TextStyle;
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

    protected applyStyle<T extends Style>(prop: keyof T, newValue: unknown) {}

    public setTextContent(text: string): void {
        this.textContent = text;
    }
}
