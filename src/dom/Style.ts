import { Color } from "../types.js";

// TODO
type BorderStyle = "round";

type Inherit<T extends object> = { [P in keyof T]: T[P] | "inherit" };
type Real<T extends object> = { [P in keyof T]: Exclude<T[P], "inherit" | "auto"> };

export type VBoxStyle = Inherit<YogaStyle & DomStyle>;
export type RBoxStyle = Real<VBoxStyle>;
export type VStyle = Inherit<VBoxStyle & TextStyle>;
export type RStyle = Real<VStyle>;

export type YogaStyle = {
    height?: number | string;
    width?: number | string;
    minWidth?: number | string;
    minHeight?: number | string;
    margin?: number;
    marginX?: number;
    marginY?: number;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
    padding?: number;
    paddingX?: number;
    paddingY?: number;
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
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
    gap?: number;
    columnGap?: number;
    rowGap?: number;
};

export type DomStyle = {
    overflow?: "visible" | "hidden";
    overflowX?: "visible" | "hidden";
    overflowY?: "visible" | "hidden";
    zIndex?: number | "auto";
    backgroundColor?: Color;
    wipeBackground?: boolean;
    borderStyle?: BorderStyle;
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

export type TextStyle = {
    color?: Color;
    backgroundColor?: Color;
    dimColor?: boolean;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    inverse?: boolean;
};
