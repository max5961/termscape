import { DomElement } from "./DomElement.js";
import { BoxElement } from "./elements/BoxElement.js";
import { TextElement } from "./elements/TextElement.js";
import type { TTagNames } from "./dom-types.js";
import Yoga from "yoga-wasm-web/auto";

export class Document {
    public static createElement(tagName: TTagNames): DomElement {
        return new BoxElement();
    }

    public static createTextNode(text: string): TextElement {
        return new TextElement(text);
    }

    public static readonly Body = new BoxElement();
}

Document.Body.node.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN);
