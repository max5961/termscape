import Yoga, { Node as YogaNode, Edge, Overflow } from "yoga-wasm-web/auto";

type Color = any;
type BorderStyle = any;

export type BoxProps = {
    readonly position?: "absolute" | "relative";
    readonly zIndex?: number | "auto";
    readonly columnGap?: number;
    readonly rowGap?: number;
    readonly gap?: number;
    readonly margin?: number;
    readonly marginX?: number;
    readonly marginY?: number;
    readonly marginTop?: number;
    readonly marginBottom?: number;
    readonly marginLeft?: number;
    readonly marginRight?: number;
    readonly padding?: number;
    readonly paddingX?: number;
    readonly paddingY?: number;
    readonly paddingTop?: number;
    readonly paddingBottom?: number;
    readonly paddingLeft?: number;
    readonly paddingRight?: number;
    readonly flexGrow?: number;
    readonly flexShrink?: number;
    readonly flexDirection?: "row" | "column" | "row-reverse" | "column-reverse";
    readonly flexBasis?: number | string;
    readonly flexWrap?: "nowrap" | "wrap" | "wrap-reverse";
    readonly alignItems?: "flex-start" | "center" | "flex-end" | "stretch";
    readonly alignSelf?: "flex-start" | "center" | "flex-end" | "auto";
    readonly justifyContent?:
        | "flex-start"
        | "flex-end"
        | "space-between"
        | "space-around"
        | "space-evenly"
        | "center";
    readonly width?: number | string;
    readonly height?: number | string;
    readonly minWidth?: number | string;
    readonly minHeight?: number | string;
    readonly display?: "flex" | "none";
    readonly backgroundColor?: Color | "inherit";
    readonly wipeBackground?: boolean;
    readonly borderStyle?: BorderStyle | "inherit";
    readonly borderTop?: boolean;
    readonly borderBottom?: boolean;
    readonly borderLeft?: boolean;
    readonly borderRight?: boolean;
    readonly borderColor?: Color | "inherit";
    readonly borderTopColor?: Color;
    readonly borderBottomColor?: Color;
    readonly borderLeftColor?: Color;
    readonly borderRightColor?: Color;
    readonly borderDimColor?: boolean;
    readonly borderTopDimColor?: boolean;
    readonly borderBottomDimColor?: boolean;
    readonly borderLeftDimColor?: boolean;
    readonly borderRightDimColor?: boolean;
    readonly overflow?: "visible" | "hidden";
    readonly overflowX?: "visible" | "hidden";
    readonly overflowY?: "visible" | "hidden";
};
