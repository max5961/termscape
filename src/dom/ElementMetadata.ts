import type { Action } from "term-keymap";
import type { ViewportStyle } from "../Types.js";
import type { DomElement } from "./DomElement.js";

export class ElementMetaData {
    public readonly ref: DomElement;
    public actions: Set<Action>;
    public viewportStyles: Set<ViewportStyle>;
    public viewportEls: Set<DomElement> | null;

    constructor(elem: DomElement) {
        this.ref = elem;
        this.actions = new Set();
        this.viewportStyles = new Set();
        this.viewportEls = null;
    }

    public setViewportStyles = (style: ViewportStyle, add: boolean): void => {
        if (add) {
            this.viewportStyles.add(style);
        } else {
            this.viewportStyles.delete(style);
        }

        if (this.viewportStyles.size) {
            this.viewportEls?.add(this.ref);
        } else {
            this.viewportEls?.delete(this.ref);
        }
    };
}
