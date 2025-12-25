import type { Pen } from "./compositor/Pen.js";
import type { Color } from "./Types.js";

export type BaseProps = {
    id?: string;
    className?: string;
    scrollbar?: Scrollbar;
    titleTopLeft?: Title;
    titleTopCenter?: Title;
    titleTopRight?: Title;
    titleBottomLeft?: Title;
    titleBottomCenter?: Title;
    titleBottomRight?: Title;
};

export type Scrollbar = {
    /** TODO */
    mode?: "auto" | "always" | "hidden";
    edge?: "right" | "left" | "top" | "bottom";
    placement?: "border" | "padding-inner" | "padding-outer";
    barChar?: string;
    barColor?: Color;
    trackChar?: string;
    trackColor?: Color;
};

export type Title = {
    textContent: string;
    color?: Color;
    style?:
        | TitleStyleConfig
        | "strikethrough"
        | "capped"
        | "capped-reverse"
        | "bracketed";
};

export type TitleStyleConfig = {
    left: string;
    right: string;
    leftColor?: Color;
    rightColor?: Color;
};

export type FocusManagerScrollProps = {
    fallthrough?: boolean;
    scrollOff?: number;
    keepFocusedCenter?: boolean;
    keepFocusedVisible?: boolean;
};

export type FocusManagerBaseProps = {
    /**
     * If `true`, children will have a locked `flexShrink` of `0`.  If `false`,
     * children will be able to set flexShrink to any valid value.
     *
     * Why?  Because a list that overflows will shrink/disappear any shrinkable
     * children in order to fit everything, instead of allowing overflow and letting
     * the list scroll as intended. If overflow is not expected, then this
     * behavior can be toggled off.
     *
     * @default `true`
     */
    blockChildrenShrink?: boolean;
};

// prettier-ignore
export type FocusManagerProps = 
    BaseProps &
    FocusManagerBaseProps &
    FocusManagerScrollProps;

export namespace Props {
    export type Box = BaseProps;
    export type Text = Omit<BaseProps, "scrollbar">;
    export type Layout = BaseProps & FocusManagerBaseProps;
    export type LayoutNode = BaseProps;
    export type List = BaseProps & FocusManagerProps;
    export type Pages = BaseProps;
    export type Root = BaseProps;
    export type Canvas = BaseProps & { draw: (pen: Pen) => unknown };
}
