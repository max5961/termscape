import { type Color } from "../types.js";

// TODO
type BorderStyle = "round";

// TODO - Can make inherit a feature later, but for now its just a hurdle to the
// design process
// type Inherit<T extends object> = { [P in keyof T]: T[P] | "inherit" };
// export type MinusInherit<T extends Inherit<object>> = {
//     [P in keyof T]: Exclude<T[P], "inherit">;
// };

type Shadow<T extends object> = {
    [P in keyof T]: Exclude<T[P], "inherit" | "auto">;
};

export type VBoxStyle = YogaStyle & DomStyle;
export type ShadowBoxStyle = Shadow<VBoxStyle>;
export type VirtualStyle = VBoxStyle & TextStyle;
export type ShadowStyle = Shadow<VirtualStyle>;
export type DynamicStyle = keyof Pick<
    VBoxStyle,
    "height" | "width" | "minHeight" | "minWidth"
>;

export type Shorthand<T> = [T] | [T, T] | [T, T, T] | [T, T, T, T];

export type YogaStyle = {
    height?: number | string;
    width?: number | string;
    minWidth?: number | string;
    minHeight?: number | string;

    margin?: number | Shorthand<number>;
    marginX?: number;
    marginY?: number;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;

    padding?: number | Shorthand<number>;
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
