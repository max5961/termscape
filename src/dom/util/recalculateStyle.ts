import type { DomElement } from "../DomElement.js";
import type { Style } from "../style/Style.js";
import { stringEnum } from "../../Util.js";

const AlwaysRecalc = stringEnum("flexShrink", "height", "width", "minHeight", "minWidth");

type AlwaysRecalcStyle = keyof typeof AlwaysRecalc;

export function shouldAlwaysRecalc(prop: keyof Style.All) {
    return prop in AlwaysRecalc;
}

export function recalculateStyle(elem: DomElement, ...styles: AlwaysRecalcStyle[]) {
    for (const style of styles) {
        // @ts-ignore
        // eslint-disable-next-line no-self-assign
        elem.style[style] = elem.style[style];
    }
}
