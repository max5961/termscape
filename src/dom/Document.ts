import { DomElement, TagName } from "./DomElement.js";
import { BoxElement } from "./elements/BoxElement.js";
import { TextElement } from "./elements/TextElement.js";

export class Document {
    public static createElement(type: TagName): DomElement {
        // if (type === "BOX_ELEMENT") return new BoxElement();
        return new BoxElement();
    }

    public static createTextNode(text: string): TextElement {
        return new TextElement(text);
    }
}
