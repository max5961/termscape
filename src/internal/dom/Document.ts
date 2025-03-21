import { DomElement, TagName } from "./DomElement.js";
import { BoxElement } from "./elements/BoxElement.js";

export class Document {
    public static createElement(type: TagName): DomElement {
        // if (type === "BOX_ELEMENT") return new BoxElement();
        // if (type === "TEXT_ELEMENT") return new TextElement();
        return new BoxElement();
    }

    public static createTextNode(text: string) {
        //
    }
}
