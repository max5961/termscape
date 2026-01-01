import { Borders, type BorderMap } from "../../shared/Boxes.js";
import type { Color } from "../../Types.js";

export type BorderStyle = keyof typeof Borders;
export type Shorthand<T> = [T] | [T, T] | [T, T, T] | [T, T, T, T];
export type Shadow<T extends Style.All> = {
    [P in keyof T]: Exclude<T[P], "inherit" | "auto">;
};

export namespace Style {
    type Dimension = {
        height?: number | string;
        width?: number | string;
    };

    type MinDimension = {
        minWidth?: number | string;
        minHeight?: number | string;
    };

    type Margin = {
        margin?: number | Shorthand<number>;
        marginX?: number;
        marginY?: number;
        marginTop?: number;
        marginBottom?: number;
        marginLeft?: number;
        marginRight?: number;
    };

    type Padding = {
        padding?: number | Shorthand<number>;
        paddingX?: number;
        paddingY?: number;
        paddingTop?: number;
        paddingBottom?: number;
        paddingLeft?: number;
        paddingRight?: number;
    };

    type Flex = {
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

    type Gap = {
        gap?: number;
        columnGap?: number;
        rowGap?: number;
    };

    type Background = {
        zIndex?: number | "auto";
        backgroundColor?: Color;
        backgroundStyle?: "dotted" | "dashed";
        backgroundStyleColor?: Color;
    };

    type Overflow = {
        overflow?: "visible" | "hidden" | "scroll";
        overflowX?: "visible" | "hidden" | "scroll";
        overflowY?: "visible" | "hidden" | "scroll";
    };

    type Edge = {
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

    /** @internal */
    type Scrollbar = {
        _scrollbarPaddingLeft?: number;
        _scrollbarPaddingRight?: number;
        _scrollbarPaddingTop?: number;
        _scrollbarPaddingBottom?: number;
        _scrollbarBorderLeft?: number;
        _scrollbarBorderRight?: number;
        _scrollbarBorderTop?: number;
        _scrollbarBorderBottom?: number;
    };

    type TextNode = {
        color?: Color;
        backgroundColor?: Color;
        dimColor?: boolean;
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
        strikethrough?: boolean;
        wrap?:
            | "overflow"
            | "wrap"
            | "truncate-start"
            | "truncate-middle"
            | "truncate-end";
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

    // prettier-ignore
    type BoxLike = 
        Dimension &
        MinDimension &
        Margin &
        Padding &
        Flex &
        Gap &
        Background &
        Overflow &
        Edge &
        Scrollbar;

    type TextLike = TextNode;

    // prettier-ignore
    export type All = BoxLike & TextLike;
    export type Box = BoxLike;
    export type Book = BoxLike;
    export type LayoutNode = BoxLike;
    export type FocusManager = BoxLike;
    export type Layout = BoxLike;
    export type List = BoxLike;
    export type Input = All; // because it sets text styles as well
    export type Text = TextLike;
    export type Canvas = Dimension & Margin;
    // prettier-ignore
    export type Root = 
        Dimension & 
        Padding &
        Omit<Background, "zIndex">;
}
