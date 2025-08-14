import type { Action } from "term-keymap";
import type { DynamicStyle } from "../style/Style.js";
import type { DomElement } from "./DomElement.js";

export class ElementMetaData {
    public readonly ref: DomElement;
    public actions: Set<Action>;
    public dynamicStyles: Set<DynamicStyle>;
    public dynamicEls: Set<DomElement> | null;

    constructor(elem: DomElement) {
        this.ref = elem;
        this.actions = new Set();
        this.dynamicStyles = new Set();
        this.dynamicEls = null;
    }

    public setDynamicStyles = (style: DynamicStyle, add: boolean): void => {
        if (add) {
            this.dynamicStyles.add(style);
        } else {
            this.dynamicStyles.delete(style);
        }

        if (this.dynamicStyles.size) {
            this.dynamicEls?.add(this.ref);
        } else {
            this.dynamicEls?.delete(this.ref);
        }
    };
}
