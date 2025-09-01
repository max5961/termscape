import type { DomElement } from "../../Types.js";
import type { BaseStyle } from "../Style.js";

const AlwaysRecalc = new Set<keyof BaseStyle>([
    "flexShrink",
    "height",
    "width",
    "minHeight",
    "minWidth",
]);

export function shouldAlwaysRecalc(prop: keyof BaseStyle) {
    return AlwaysRecalc.has(prop);
}

export function recalculateStyle(elem: DomElement, ...styles: (keyof BaseStyle)[]) {
    for (const style of styles) {
        // @ts-ignore
        // eslint-disable-next-line no-self-assign
        elem.style[style] = elem.style[style];
    }
}
