import { DomElement } from "../DomElement.js";
import { TextStyle } from "./attributes/text/TextStyle.js";
import { Root } from "../Root.js";

export class TextElement extends DomElement {
    public textContent: string;
    public style: TextStyle;

    constructor(root: Root, textContent: string, scheduleRender: Root["scheduleRender"]) {
        super(root, "TEXT_ELEMENT", scheduleRender);
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
