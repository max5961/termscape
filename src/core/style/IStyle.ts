import type { BorderMap } from "../Boxes.js";
import type { ColorValue } from "../../Types.js";
import type { Shorthand, BorderStyle } from "./types.js";

// -----------------------------------------------------------------------------
// Wide
// These styles do not exist in the shadow.  They will be set in virtual.  These
// set the more narrow options in shadow, so long as that narrow option has not
// already been explicitly set by a more narrow style.
// -----------------------------------------------------------------------------

// prettier-ignore
export interface IWideStyle extends 
        IWideMarginStyle,
        IWidePaddingStyle,
        IWideGapStyle,
        IWideOverflowStyle,
        IWideEdgeStyle
{}
export interface IWideMarginStyle {
    // margin?: number | Shorthand<number>;
    margin?: number;
}
export interface IWidePaddingStyle {
    // padding?: number | Shorthand<number>;
    padding?: number;
}
export interface IWideEdgeStyle {
    borderStyle?: BorderStyle | BorderMap;
    borderColor?: ColorValue;
    borderDimColor?: boolean;
}
export interface IWideOverflowStyle {
    overflow?: "visible" | "hidden";
}
export interface IWideGapStyle {
    gap?: number;
}

// -----------------------------------------------------------------------------
// Middle
// Like `wide` styles, these do not exist in the shadow and will be set in virtual.
// These are more narrow than the wide styles, so they will be able to override
// any narrow shadows set by a wide style.
// -----------------------------------------------------------------------------

// prettier-ignore
export interface IMiddleStyle extends 
    IMiddleMarginStyle, 
    IMiddlePaddingStyle 
{}
export interface IMiddleMarginStyle {
    marginX?: number;
    marginY?: number;
}
export interface IMiddlePaddingStyle {
    paddingX?: number;
    paddingY?: number;
}

// -----------------------------------------------------------------------------
// Narrow
// If set by a wider style, only the shadow is given a value and only if the virtual
// has not yet been set for that given value.
// If set explicitly by itself, both the shadow and virtual are set.
// If unset by itself or from a wider style, value will resolve to the value of a
// wider style.
// -----------------------------------------------------------------------------

// prettier-ignore
export interface INarrowStyle extends 
    INarrowMarginStyle, 
    INarrowPaddingStyle,
    INarrowGapStyle,
    INarrowOverflowStyle,
    INarrowEdgeStyle
{}

export interface INarrowMarginStyle {
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
}

export interface INarrowPaddingStyle {
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
}

export interface INarrowGapStyle {
    columnGap?: number;
    rowGap?: number;
}

export interface INarrowOverflowStyle {
    overflowX?: "visible" | "hidden";
    overflowY?: "visible" | "hidden";
}

export interface INarrowEdgeStyle {
    borderTop?: boolean;
    borderBottom?: boolean;
    borderLeft?: boolean;
    borderRight?: boolean;
    borderTopColor?: ColorValue;
    borderBottomColor?: ColorValue;
    borderLeftColor?: ColorValue;
    borderRightColor?: ColorValue;
    borderTopDimColor?: boolean;
    borderBottomDimColor?: boolean;
    borderLeftDimColor?: boolean;
    borderRightDimColor?: boolean;
}

// -----------------------------------------------------------------------------
// Composites
// -----------------------------------------------------------------------------

// prettier-ignore
export interface IMarginStyle extends 
    IWideMarginStyle,
    IMiddleMarginStyle,
    INarrowMarginStyle
{}

// prettier-ignore
export interface IPaddingStyle extends 
    IWidePaddingStyle,
    IMiddlePaddingStyle,
    INarrowPaddingStyle
{}

// prettier-ignore
export interface IOverflowStyle extends
    IWideOverflowStyle,
    INarrowOverflowStyle
{}

// prettier-ignore
export interface IEdgeStyle extends
    IWideEdgeStyle,
    INarrowEdgeStyle
{}

// prettier-ignore
export interface IGapStyle extends
    IWideGapStyle,
    INarrowGapStyle
{}

// -----------------------------------------------------------------------------
// Naturally narrow interfaces
// -----------------------------------------------------------------------------

export interface IDimensionStyle {
    height?: number | string;
    width?: number | string;
    minHeight?: number | string;
    minWidth?: number | string;
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

export interface IBackgroundStyle {
    zIndex?: number;
    backgroundColor?: ColorValue;
    backgroundStyle?: "dotted" | "dashed" | { char: string };
    backgroundStyleColor?: ColorValue;
}

export interface IAnsiEffectStyle {
    color?: ColorValue;
    dimColor?: boolean;
    backgroundColor?: ColorValue;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    imagePositive?: boolean;
    imageNegative?: boolean;
}

export interface ITextStyle extends IAnsiEffectStyle {
    wrap?: "overflow" | "wrap" | "truncate-start" | "truncate-middle" | "truncate-end";
    align?: "left" | "center" | "right";
}

// prettier-ignore
export interface IShadowStyle extends 
    INarrowStyle,
    IDimensionStyle,
    IFlexStyle,
    ITextStyle,
    IBackgroundStyle 
{
    // borderStyle needs to exist in both shadow and wide
    borderStyle?: IWideEdgeStyle["borderStyle"];
}

// prettier-ignore
export interface IStyle extends
    IDimensionStyle,
    IMarginStyle,
    IPaddingStyle,
    IFlexStyle,
    IGapStyle,
    IBackgroundStyle,
    IOverflowStyle,
    IEdgeStyle,
    ITextStyle 
{}
