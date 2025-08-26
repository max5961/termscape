import { configureStdin } from "term-keymap";
import { TagNames } from "./Constants.js";
import type { Color } from "ansi-escape-sequences";
import type { DomElement } from "./dom/DomElement.js";
import type { BorderMap, Borders } from "./shared/Borders.js";
export type { DomElement } from "./dom/DomElement.js";

export type { Color, BgColor, TextEffect, AnsiStyle } from "ansi-escape-sequences";
export type { Node as YogaNode } from "yoga-wasm-web/auto";

export type Hex = `#${string}`;

export type Rgb = `rgb(${string}${string}${string})`;

export type TTagNames = (typeof TagNames)[keyof typeof TagNames];

export type Point = { x: number; y: number };

export type DOMRect = {
    x: number;
    y: number;
    height: number;
    bottom: number;
    width: number;
    top: number;
    left: number;
    right: number;
};

export type GridToken = {
    ansi: string;
    char: string;
    charWidth: number;
};

export type EventEmitterMap = {
    MouseEvent: [x: number, y: number, type: MouseEventType];
    CursorPosition: [y: number];
};

export type ConfigureStdin = Exclude<Parameters<typeof configureStdin>[0], undefined>;

export type RuntimeConfig = {
    /** Renders occur at an interval no faster than `debounceMs` ms. */
    debounceMs?: number;
    /** Use terminal's alt screen buffer. Preserve main screen. */
    altScreen?: boolean;
    /** `Ctrl + c` ends the runtime for this Root. */
    exitOnCtrlC?: boolean;
    /** Forces process exit after this Root's runtime ends. Skips `waitUntilExit` promises. */
    exitForcesEndProc?: boolean;
    /** Experimental - rewrites only cells that are diffed from prev rendered output. */
    preciseWrite?: boolean;
    /** If this is `false`, runtime can be explictly started at any given time with `Root.startRuntime`. */
    startOnCreate?: boolean;
} & ConfigureStdin;

// TODO
type BorderStyle = keyof typeof Borders;

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
export type VirtualStyle = VBoxStyle & TextStyle & ListStyle;
export type ShadowStyle = Shadow<VirtualStyle>;
export type ViewportStyle = keyof Pick<
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
    overflow?: "visible" | "hidden" | "scroll";
    overflowX?: "visible" | "hidden" | "scroll";
    overflowY?: "visible" | "hidden" | "scroll";
    zIndex?: number | "auto";
    backgroundColor?: Color;
    wipeBackground?: boolean;
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

export type TextStyle = {
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
};

export type ListStyle = {
    // This is not cool that these are copypasted from VirtualStyle
    height?: number | string;
    width?: number | string;
    minWidth?: number | string;
    minHeight?: number | string;

    // flexDirection?: "column" | "row";
    fallthrough?: boolean;
    scrollOff?: number;
    keepFocusedVisible?: boolean;
    keepFocusedCenter?: boolean;

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

export type MouseEventType =
    // LEFT BTN
    | "click"
    | "dblclick"
    | "mousedown"
    | "mouseup"

    // RIGHT BTN
    | "rightclick"
    | "rightdblclick"
    | "rightmousedown"
    | "rightmouseup"

    // SCROLL WHEEL
    | "scrollup"
    | "scrolldown"
    | "scrollclick"
    | "scrolldblclick"
    | "scrollbtndown"
    | "scrollbtnup"

    // MOVEMENT
    | "mousemove"
    | "drag"
    | "dragstart"
    | "dragend";

export type MouseEvent = {
    type: MouseEventType;
    clientX: number;
    clientY: number;
    target: DomElement;
    currentTarget: DomElement;
    stopPropagation: () => void;
    stopImmediatePropagation: () => void;
};

export type MouseEventHandler = (e: MouseEvent) => unknown;

export type Stdout = Required<RuntimeConfig>["stdout"];
export type Stdin = Required<RuntimeConfig>["stdin"];

export type WriteOpts = {
    resize?: boolean;
    capturedOutput?: string;
    screenChange?: boolean;
    skipCalculateLayout?: boolean;
};

export type StyleHandler<T extends VirtualStyle> = ({
    focus,
    shallowFocus,
}: {
    focus: boolean;
    shallowFocus: boolean;
}) => T;
