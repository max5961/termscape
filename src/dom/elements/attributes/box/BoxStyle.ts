type Color = any;
type BorderStyle = any;

export type BoxStyle = {
    position?: "absolute" | "relative";
    zIndex?: number | "auto";
    gap?: number;
    columnGap?: number;
    rowGap?: number;
    margin?: number | string;
    marginX?: number | string;
    marginY?: number | string;
    marginTop?: number | string;
    marginBottom?: number | string;
    marginLeft?: number | string;
    marginRight?: number | string;
    padding?: number;
    paddingX?: number;
    paddingY?: number;
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
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
    width?: number | string;
    height?: number | string;
    minWidth?: number | string;
    minHeight?: number | string;
    display?: "flex" | "none";
    backgroundColor?: Color | "inherit";
    wipeBackground?: boolean;
    borderStyle?: BorderStyle | "inherit";
    borderTop?: boolean;
    borderBottom?: boolean;
    borderLeft?: boolean;
    borderRight?: boolean;
    borderColor?: Color | "inherit";
    borderTopColor?: Color;
    borderBottomColor?: Color;
    borderLeftColor?: Color;
    borderRightColor?: Color;
    borderDimColor?: boolean;
    borderTopDimColor?: boolean;
    borderBottomDimColor?: boolean;
    borderLeftDimColor?: boolean;
    borderRightDimColor?: boolean;
    overflow?: "visible" | "hidden";
    overflowX?: "visible" | "hidden";
    overflowY?: "visible" | "hidden";
};
