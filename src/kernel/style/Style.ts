import type { BorderMap } from "../../shared/Boxes.js";
import type { Color } from "../../Types.js";
import type { Shorthand, BorderStyle } from "./types.js";

export interface IDimensionStyle {
    height?: number | string;
    width?: number | string;
    minHeight?: number | string;
    minWidth?: number | string;
}

export interface IShadowMarginStyle {
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
}

export interface IMarginStyle extends IShadowMarginStyle {
    margin?: number | Shorthand<number>;
    marginX?: number;
    marginY?: number;
}

export interface IShadowPaddingStyle {
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
}

export interface IPaddingStyle extends IShadowPaddingStyle {
    padding?: number | Shorthand<number>;
    paddingX?: number;
    paddingY?: number;
}

export interface IFlexStyle {
    position?: "absolute" | "relative";
    display?: "flex" | "none";
    flexGrow?: number;
    flexShrink?: number;
    flexDirection?: "row" | "column" | "row-reverse" | "column-reverse";
    flexBasis?: number | string;
    flexWrap?: "nowrap" | "wrap" | "wrap-reverse";
    alignItems?: "flex-start" | "center" | "flex-end" | "stretch";
    alignSelf?: "flex-start" | "center" | "flex-end";
    justifyContent?:
        | "flex-start"
        | "flex-end"
        | "space-between"
        | "space-around"
        | "space-evenly"
        | "center";
}

export interface IShadowGapStyle {
    columnGap?: number;
    rowGap?: number;
}

export interface IGapStyle extends IShadowGapStyle {
    gap?: number;
}

export interface IBackgroundStyle {
    zIndex?: number;
    backgroundColor?: Color;
    backgroundStyle?: "dotted" | "dashed" | { char: string };
    backgroundStyleColor?: Color;
}

export interface IShadowOverflowStyle {
    overflowX?: "visible" | "hidden" | "scroll";
    overflowY?: "visible" | "hidden" | "scroll";
}

export interface IOverflowStyle extends IShadowOverflowStyle {
    overflow?: "visible" | "hidden" | "scroll";
}

export interface IShadowEdgeStyle {
    borderStyle?: BorderStyle | BorderMap;
    borderTop?: boolean;
    borderBottom?: boolean;
    borderLeft?: boolean;
    borderRight?: boolean;
    borderTopColor?: Color;
    borderBottomColor?: Color;
    borderLeftColor?: Color;
    borderRightColor?: Color;
    borderTopDimColor?: boolean;
    borderBottomDimColor?: boolean;
    borderLeftDimColor?: boolean;
    borderRightDimColor?: boolean;
}

export interface IEdgeStyle extends IShadowEdgeStyle {
    borderColor?: Color;
    borderDimColor?: boolean;
}

export interface ITextStyle {
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
}

// prettier-ignore
export interface IStyle extends
    RequiredPartial<IDimensionStyle>,
    RequiredPartial<IMarginStyle>,
    RequiredPartial<IPaddingStyle>,
    RequiredPartial<IFlexStyle>,
    RequiredPartial<IGapStyle>,
    RequiredPartial<IBackgroundStyle>,
    RequiredPartial<IOverflowStyle>,
    RequiredPartial<IEdgeStyle>,
    RequiredPartial<ITextStyle> 
{}

// prettier-ignore
export interface IShadowStyle extends
    RequiredPartial<IDimensionStyle>,
    RequiredPartial<IShadowMarginStyle>,
    RequiredPartial<IShadowPaddingStyle>,
    RequiredPartial<IFlexStyle>,
    RequiredPartial<IShadowGapStyle>,
    RequiredPartial<IBackgroundStyle>,
    RequiredPartial<IShadowOverflowStyle>,
    RequiredPartial<IShadowEdgeStyle>,
    RequiredPartial<ITextStyle>
{}

type RequiredPartial<T extends object> = {
    [P in keyof Required<T>]: Required<T>[P] | undefined;
};

export namespace Style {
    export type All = Partial<IStyle>;

    export type Box = IDimensionStyle &
        IMarginStyle &
        IPaddingStyle &
        IFlexStyle &
        IGapStyle &
        IBackgroundStyle &
        IOverflowStyle &
        IEdgeStyle;

    export type Text = ITextStyle;
}
