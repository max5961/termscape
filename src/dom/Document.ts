import { DomElement } from "./DomElement.js";
import { BoxElement } from "./elements/BoxElement.js";
import { TextElement } from "./elements/TextElement.js";
import type { TTagNames } from "../types.js";

export class Document {
    public static createElement(tagName: Exclude<TTagNames, "ROOT_ELEMENT">): DomElement {
        return new BoxElement();
    }

    public static createTextNode(text: string): TextElement {
        return new TextElement(text);
    }

    public static readonly Body = new BoxElement();
}
