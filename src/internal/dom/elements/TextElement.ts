import { TextProps } from "../../props/text/TextProps.js";
import { DomElement } from "../DomElement.js";

export class TextElement extends DomElement {
    public textContent: string;

    constructor(textContent: string) {
        super();
        this.tagname === "TEXT_ELEMENT";
        this.textContent = textContent;
    }

    public setProps(props: TextProps): void {
        //
    }

    public addEventListener(): void {
        //
    }

    public setTextContent(text: string): void {
        this.textContent = text;
    }
}
