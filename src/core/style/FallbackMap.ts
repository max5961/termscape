import type { IMiddleStyle, INarrowStyle, IWideStyle } from "./IStyle.js";

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
        3: "margin",
        2: "marginY",
    },
    marginBottom: {
        3: "margin",
        2: "marginY",
    },
    marginLeft: {
        3: "margin",
        2: "marginX",
    },
    marginRight: {
        3: "margin",
        2: "marginX",
    },
    paddingTop: {
        3: "padding",
        2: "paddingY",
    },
    paddingBottom: {
        3: "padding",
        2: "paddingY",
    },
    paddingLeft: {
        3: "padding",
        2: "paddingX",
    },
    paddingRight: {
        3: "padding",
        2: "paddingX",
    },
    columnGap: {
        2: "gap",
    },
    rowGap: {
        2: "gap",
    },
    overflowX: {
        2: "overflow",
    },
    overflowY: {
        2: "overflow",
    },
    borderTop: {
        2: "borderStyle",
    },
    borderBottom: {
        2: "borderStyle",
    },
    borderLeft: {
        2: "borderStyle",
    },
    borderRight: {
        2: "borderStyle",
    },
    borderTopColor: {
        2: "borderColor",
    },
    borderBottomColor: {
        2: "borderColor",
    },
    borderLeftColor: {
        2: "borderColor",
    },
    borderRightColor: {
        2: "borderColor",
    },
    borderTopDimColor: {
        2: "borderDimColor",
    },
    borderBottomDimColor: {
        2: "borderDimColor",
    },
    borderLeftDimColor: {
        2: "borderDimColor",
    },
    borderRightDimColor: {
        2: "borderDimColor",
    },
} as const satisfies {
    [_ in keyof Required<INarrowStyle>]: {
        3?: keyof IWideStyle;
        2?: keyof IMiddleStyle | keyof IWideStyle;
    };
};
