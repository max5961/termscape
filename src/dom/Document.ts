import { BoxElement } from "./elements/BoxElement.js";
import { TextElement } from "./elements/TextElement.js";
import type { TTagNames } from "../types.js";
import { TagNames } from "../constants.js";

export class Document {
    // public static createElement(tagName)
    public static createElement(tagName: typeof TagNames.Box): BoxElement;
    public static createElement(tagName: Exclude<TTagNames, "ROOT_ELEMENT">): BoxElement {
        return new BoxElement();
    }

    public static createTextNode(text: string): TextElement {
        return new TextElement(text);
    }

    public static readonly Body = new BoxElement();
}
