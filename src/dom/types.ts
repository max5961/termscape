import type {
    IBackgroundStyle,
    IDimensionStyle,
    IEdgeStyle,
    IFlexStyle,
    IGapStyle,
    IMarginStyle,
    IOverflowStyle,
    IStyle,
    ITextStyle,
} from "../core/style/IStyle.js";

export type Style<T extends keyof IStyle> = Pick<IStyle, T>;

export namespace DomStyle {
    export type Box =
        | keyof IDimensionStyle
        | keyof IMarginStyle
        | keyof IFlexStyle
        | keyof IGapStyle
        | keyof IBackgroundStyle
        | keyof IOverflowStyle
        | keyof IEdgeStyle;

    export type Text = keyof ITextStyle;
}
