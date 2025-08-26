import type { DomElement, VirtualStyle } from "../../Types.js";

const AlwaysRecalc = new Set<keyof VirtualStyle>([
    "flexShrink",
    "height",
    "width",
    "minHeight",
    "minWidth",
]);

export function shouldAlwaysRecalc(prop: keyof VirtualStyle) {
    return AlwaysRecalc.has(prop);
}

export function recalculateStyle(elem: DomElement, ...styles: (keyof VirtualStyle)[]) {
    for (const style of styles) {
        // @ts-ignore
        // eslint-disable-next-line no-self-assign
        elem.style[style] = elem.style[style];
    }
}
