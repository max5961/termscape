import type { Color } from "../../../../types.js";
type BorderStyle = any;

type Inherit<T extends object> = { [P in keyof T]: T[P] | "inherit" };

export type BoxStyle = Inherit<{
    height?: number | string;
    width?: number | string;
    minWidth?: number | string;
    minHeight?: number | string;
    margin?: number | string;
    marginX?: number | string;
    marginY?: number | string;
    marginTop?: number | string;
    marginBottom?: number | string;
    marginLeft?: number | string;
    marginRight?: number | string;
    overflow?: "visible" | "hidden";
    overflowX?: "visible" | "hidden";
    overflowY?: "visible" | "hidden";
    padding?: number;
    paddingX?: number;
    paddingY?: number;
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
    zIndex?: number | "auto";
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
}>;
