import { TextProps } from "../../props/text/TextProps.js";
import { TextStyle } from "../../props/text/TextStyle.js";
import { DomElement } from "../DomElement.js";
import { SetStyle } from "../SetStyle.js";

export class TextElement extends DomElement {
    public textContent: string;

    constructor(textContent: string) {
        super();
        this.tagname === "TEXT_ELEMENT";
        this.textContent = textContent;
    }

    public setStyle(style: TextStyle): void {
        // for (const key in style) {
        //     const k = key as keyof TextStyle;
        //     SetStyle.Text[k]?.(this.node, style[k]);
        // }
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
