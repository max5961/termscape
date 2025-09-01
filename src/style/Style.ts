import { Borders, type BorderMap } from "../shared/Borders.js";
import type { Color } from "../Types.js";

export type BorderStyle = keyof typeof Borders;
export type Shorthand<T> = [T] | [T, T] | [T, T, T] | [T, T, T, T];

export namespace YogaStyle {
    // prettier-ignore
    export type Style = 
        DimensionStyle &
        MarginStyle &
        PaddingStyle &
        FlexStyle &
        GapStyle;

    export type DimensionStyle = {
        height?: number | string;
        width?: number | string;
        minWidth?: number | string;
        minHeight?: number | string;
    };

    export type MarginStyle = {
        margin?: number | Shorthand<number>;
        marginX?: number;
        marginY?: number;
        marginTop?: number;
        marginBottom?: number;
        marginLeft?: number;
        marginRight?: number;
    };

    export type PaddingStyle = {
        padding?: number | Shorthand<number>;
        paddingX?: number;
        paddingY?: number;
        paddingTop?: number;
        paddingBottom?: number;
        paddingLeft?: number;
        paddingRight?: number;
    };

    export type FlexStyle = {
        position?: "absolute" | "relative";
        display?: "flex" | "none";
        flexGrow?: number;
        flexShrink?: number;
        flexDirection?: "row" | "column" | "row-reverse" | "column-reverse";
        flexBasis?: number | string;
        flexWrap?: "nowrap" | "wrap" | "wrap-reverse";
        alignItems?: "flex-start" | "center" | "flex-end" | "stretch";
        alignSelf?: "flex-start" | "center" | "flex-end" | "auto";
        justifyContent?:
            | "flex-start"
            | "flex-end"
            | "space-between"
            | "space-around"
            | "space-evenly"
            | "center";
    };

    export type GapStyle = {
        gap?: number;
        columnGap?: number;
        rowGap?: number;
    };
}

export namespace DomElementStyle {
    // prettier-ignore
    export type Style = 
        OverflowStyle &
        EdgeStyle & 
        {
            zIndex?: number | "auto";
            backgroundColor?: Color;
            wipeBackground?: boolean;
        };

    export type OverflowStyle = {
        overflow?: "visible" | "hidden" | "scroll";
        overflowX?: "visible" | "hidden" | "scroll";
        overflowY?: "visible" | "hidden" | "scroll";
    };

    export type EdgeStyle = {
        borderStyle?: BorderStyle | BorderMap;
        borderTop?: boolean;
        borderBottom?: boolean;
        borderLeft?: boolean;
        borderRight?: boolean;
        borderColor?: Color;
        borderTopColor?: Color;
        borderBottomColor?: Color;
        borderLeftColor?: Color;
        borderRightColor?: Color;
        borderDimColor?: boolean;
        borderTopDimColor?: boolean;
        borderBottomDimColor?: boolean;
        borderLeftDimColor?: boolean;
        borderRightDimColor?: boolean;
    };
}

export type TextStyle = {
    color?: Color;
    backgroundColor?: Color;
    dimColor?: boolean;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    wrap?: "overflow" | "wrap" | "truncate-start" | "truncate-middle" | "truncate-end";
    align?: "left" | "center" | "right";
    imagePositive?: boolean;
    imageNegative?: boolean;
    fontDefault?: boolean;
    font1?: boolean;
    font2?: boolean;
    font3?: boolean;
    font4?: boolean;
    font5?: boolean;
    font6?: boolean;
};

type Shadow<T extends object> = {
    [P in keyof T]: Exclude<T[P], "inherit" | "auto">;
};

// prettier-ignore
export type BaseStyle = 
    YogaStyle.Style &
    DomElementStyle.Style &
    TextStyle

export type BaseShadowStyle = Shadow<BaseStyle>;

export type BoxStyle = YogaStyle.Style & DomElementStyle.Style;
export type ShadowBoxStyle = Shadow<BoxStyle>;

// TextStyle already defined
export type ShadowTextStyle = Shadow<TextStyle>;
