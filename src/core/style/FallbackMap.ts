import type { IMiddleStyle, INarrowStyle, IWideStyle } from "./IStyle.js";

export const enum Fallback {
    Wide = 3,
    Middle = 2,
}

export const MiddleFallbackMap = {
    marginX: "margin",
    marginY: "margin",
    paddingX: "padding",
    paddingY: "padding",
} as const satisfies {
    [_ in keyof Required<IMiddleStyle>]: keyof IWideStyle;
};

export const NarrowFallbackMap = {
    marginTop: {
        [Fallback.Wide]: "margin",
        [Fallback.Middle]: "marginY",
    },
    marginBottom: {
        [Fallback.Wide]: "margin",
        [Fallback.Middle]: "marginY",
    },
    marginLeft: {
        [Fallback.Wide]: "margin",
        [Fallback.Middle]: "marginX",
    },
    marginRight: {
        [Fallback.Wide]: "margin",
        [Fallback.Middle]: "marginX",
    },
    paddingTop: {
        [Fallback.Wide]: "padding",
        [Fallback.Middle]: "paddingY",
    },
    paddingBottom: {
        [Fallback.Wide]: "padding",
        [Fallback.Middle]: "paddingY",
    },
    paddingLeft: {
        [Fallback.Wide]: "padding",
        [Fallback.Middle]: "paddingX",
    },
    paddingRight: {
        [Fallback.Wide]: "padding",
        [Fallback.Middle]: "paddingX",
    },
    columnGap: {
        [Fallback.Middle]: "gap",
    },
    rowGap: {
        [Fallback.Middle]: "gap",
    },
    overflowX: {
        [Fallback.Middle]: "overflow",
    },
    overflowY: {
        [Fallback.Middle]: "overflow",
    },
    borderTop: {
        [Fallback.Middle]: "borderStyle",
    },
    borderBottom: {
        [Fallback.Middle]: "borderStyle",
    },
    borderLeft: {
        [Fallback.Middle]: "borderStyle",
    },
    borderRight: {
        [Fallback.Middle]: "borderStyle",
    },
    borderTopColor: {
        [Fallback.Middle]: "borderColor",
    },
    borderBottomColor: {
        [Fallback.Middle]: "borderColor",
    },
    borderLeftColor: {
        [Fallback.Middle]: "borderColor",
    },
    borderRightColor: {
        [Fallback.Middle]: "borderColor",
    },
    borderTopDimColor: {
        [Fallback.Middle]: "borderDimColor",
    },
    borderBottomDimColor: {
        [Fallback.Middle]: "borderDimColor",
    },
    borderLeftDimColor: {
        [Fallback.Middle]: "borderDimColor",
    },
    borderRightDimColor: {
        [Fallback.Middle]: "borderDimColor",
    },
} as const satisfies {
    [_ in keyof Required<INarrowStyle>]: {
        [Fallback.Wide]?: keyof IWideStyle;
        [Fallback.Middle]: keyof IMiddleStyle | keyof IWideStyle;
    };
};
