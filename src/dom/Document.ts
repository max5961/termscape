import { DomElement, TTagName } from "./DomElement.js";
import { BoxElement } from "./elements/BoxElement.js";
import { TextElement } from "./elements/TextElement.js";

export class Document {
    public static createElement(_type: TTagName): DomElement {
        return new BoxElement();
    }

    public static createTextNode(text: string): TextElement {
        return new TextElement(text);
    }
}
