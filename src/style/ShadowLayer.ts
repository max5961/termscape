import { WriteOpts } from "../render/Renderer.js";
import { VStyle, RStyle } from "./Style.js";

const YogaPadding = new Set<keyof RStyle>([
    "padding",
    "paddingX",
    "paddingY",
    "paddingTop",
    "paddingRight",
    "paddingLeft",
    "paddingBottom",
]);

const YogaMargin = new Set<keyof RStyle>([
    "margin",
    "marginX",
    "marginY",
    "marginTop",
    "marginRight",
    "marginLeft",
    "marginBottom",
]);

const YogaBorders = new Set<keyof RStyle>([
    "borderStyle",
    "borderTop",
    "borderBottom",
    "borderRight",
    "borderLeft",
]);

// prettier-ignore
const YogaGap = new Set<keyof RStyle>([
    "gap", 
    "rowGap", 
    "columnGap"
])

const DrawBorders = new Set<keyof RStyle>([
    "borderColor",
    "borderTopColor",
    "borderTopDimColor",
    "borderBottomColor",
    "borderBottomDimColor",
    "borderLeftColor",
    "borderLeftDimColor",
    "borderRightColor",
    "borderRightDimColor",
]);

const Groupings = [
    {
        grouping: new Set<keyof RStyle>([
            "padding",
            "paddingX",
            "paddingY",
            "paddingTop",
            "paddingRight",
            "paddingLeft",
            "paddingBottom",
        ]),
        handler() {
            //
        },
    },
    {
        grouping: new Set<keyof RStyle>([
            "padding",
            "paddingX",
            "paddingY",
            "paddingTop",
            "paddingRight",
            "paddingLeft",
            "paddingBottom",
        ]),
        handler() {},
    },

    {
        grouping: new Set<keyof RStyle>([
            "margin",
            "marginX",
            "marginY",
            "marginTop",
            "marginRight",
            "marginLeft",
            "marginBottom",
        ]),
        handler() {},
    },

    {
        grouping: new Set<keyof RStyle>([
            "borderStyle",
            "borderTop",
            "borderBottom",
            "borderRight",
            "borderLeft",
        ]),
        handler() {},
    },

    // prettier-ignore
    { grouping: new Set<keyof RStyle>([
    "gap", 
    "rowGap", 
    "columnGap"
]), handler() {} },

    {
        grouping: new Set<keyof RStyle>([
            "borderColor",
            "borderTopColor",
            "borderTopDimColor",
            "borderBottomColor",
            "borderBottomDimColor",
            "borderLeftColor",
            "borderLeftDimColor",
            "borderRightColor",
            "borderRightDimColor",
        ]),
        handler() {},
    },

    {
        grouping: new Set<keyof RStyle>([
            "padding",
            "paddingX",
            "paddingY",
            "paddingTop",
            "paddingRight",
            "paddingLeft",
            "paddingBottom",
        ]),
        handler() {
            //
        },
    },
] as const;

// prettier-ignore
const Overflow = new Set<keyof RStyle>([
    "overflow", 
    "overflowX",
    "overflowY",
])

export function createShadowProxy(updater: (opts: WriteOpts) => unknown) {
    return new Proxy(
        {},
        {
            set(target, prop, nextVal) {
                //
            },
        },
    );
}
