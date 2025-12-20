import type { DomElement } from "../../Types.js";
import { stringEnum } from "../../Util.js";
import type { BaseStyle } from "../Style.js";

const AlwaysRecalc = stringEnum("flexShrink", "height", "width", "minHeight", "minWidth");

type AlwaysRecalcStyle = keyof typeof AlwaysRecalc;

export function shouldAlwaysRecalc(prop: keyof BaseStyle) {
    return prop in AlwaysRecalc;
}

export function recalculateStyle(elem: DomElement, ...styles: AlwaysRecalcStyle[]) {
    for (const style of styles) {
        // @ts-ignore
        // eslint-disable-next-line no-self-assign
        elem.style[style] = elem.style[style];
    }
}
