import type { Action } from "term-keymap";
import type { TitleBorders } from "../../shared/Boxes.js";
import type { Color, ReqProps } from "../../Types.js";
import type { Pen } from "../../compositor/Pen.js";

export type Scrollbar = {
    /** TODO - default is 'always' */
    mode?: "auto" | "always" | "hidden";
    /** @default
     * - "right" if flexDirection is column or column-reverse
     * - "left" if flexDirection is row or row-reverse
     *   */
    edge?: "right" | "left" | "top" | "bottom";
    placement?: "border" | "padding-inner" | "padding-outer";
    barChar?: string;
    barColor?: Color;
    trackChar?: string;
    trackColor?: Color;
};

export type TitleStyleConfig = {
    /** Styles the Title with a character to the left of the text content */
    left: string;
    right: string;
    leftColor?: Color;
    rightColor?: Color;
};

export type Title = {
    textContent: string;
    color?: Color;
    style?: TitleStyleConfig | keyof typeof TitleBorders;
};

export namespace Props {
    type Base = {
        id?: string;
        className?: string;
    };

    type BoxProps = {
        scrollbar?: Scrollbar;
        titleTopLeft?: Title;
        titleTopCenter?: Title;
        titleTopRight?: Title;
        titleBottomLeft?: Title;
        titleBottomCenter?: Title;
        titleBottomRight?: Title;
    };

    type TextInput = {
        enter?: Action["keymap"][];
        exit?: Action["keymap"][];
        nextWord?: Action["keymap"][];
        prevWord?: Action["keymap"][];
        deleteWord?: Action["keymap"][];
        cursorRight?: Action["keymap"][];
        cursorLeft?: Action["keymap"][];
        startOfLine?: Action["keymap"][];
        endOfLine?: Action["keymap"][];
        undoPrev?: Action["keymap"][];
        redoPrev?: Action["keymap"][];
        enterOnFocus?: boolean; // in order for this to work we need to be able to subscribe to focus change
        tabWidth?: number;
    };

    type FocusManagerScroll = {
        fallthrough?: boolean;
        scrollOff?: number;
        keepFocusedCenter?: boolean;
        keepFocusedVisible?: boolean;
    };

    type FocusManagerBase = {
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

    type CanvasProps = {
        draw?: (pen: Pen) => unknown;
    };

    // prettier-ignore
    export type All = 
        Base &
        BoxProps &
        TextInput &
        FocusManagerBase &
        FocusManagerScroll & 
        CanvasProps;

    export type BoxLike = Base & BoxProps;

    export type Root = Base;
    export type Text = Base;
    export type Box = BoxLike;
    export type Book = BoxLike;
    export type FocusManager = BoxLike & FocusManagerBase;
    export type List = FocusManager & FocusManagerScroll;
    export type Layout = FocusManager;
    export type LayoutNode = BoxLike;
    export type Canvas = Base & CanvasProps;
    export type Input = ReqProps<BoxLike & TextInput, "enter" | "exit">;
}
