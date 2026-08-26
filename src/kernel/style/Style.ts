import type { BorderMap } from "../../shared/Boxes.js";
import type { Color } from "../../Types.js";
import type { Shorthand, BorderStyle } from "./types.js";

interface IDimension {
    height?: number | string;
    width?: number | string;
}

interface IMinDimension {
    minHeight?: number | string;
    minWidth?: number | string;
}

interface IMargin {
    margin?: number | Shorthand<number>;
    marginX?: number;
    marginY?: number;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
}

interface IPadding {
    padding?: number | Shorthand<number>;
    paddingX?: number;
    paddingY?: number;
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
}

interface IFlex {
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

interface IGap {
    gap?: number;
    columnGap?: number;
    rowGap?: number;
}

interface IBackground {
    zIndex?: number;
    backgroundColor?: Color;
    backgroundStyle?: "dotted" | "dashed" | { char: string };
    backgroundStyleColor?: Color;
}

interface IOverflow {
    overflow?: "visible" | "hidden" | "scroll";
    overflowX?: "visible" | "hidden" | "scroll";
    overflowY?: "visible" | "hidden" | "scroll";
}

interface IEdge {
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
}

interface IText {
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

export namespace Style {
    export type Box = IDimension &
        IMinDimension &
        IMargin &
        IPadding &
        IFlex &
        IGap &
        IBackground &
        IOverflow &
        IEdge;

    export type Text = IText;
}
