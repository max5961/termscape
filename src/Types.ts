import { configureStdin } from "term-keymap";
import { TagNameEnum } from "./Constants.js";
import type { DomElement } from "./dom/DomElement.js";
import type { BaseStyle } from "./style/Style.js";
export type { DomElement } from "./dom/DomElement.js";

export type { Color, BgColor, TextEffect, AnsiStyle } from "ansi-escape-sequences";
export type { Node as YogaNode } from "yoga-wasm-web/auto";

export type ExtractUnion<T, U extends T> = U extends T ? U : never;

export type Hex = `#${string}`;

export type Rgb = `rgb(${string}${string}${string})`;

export type TagName = (typeof TagNameEnum)[keyof typeof TagNameEnum];

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

export type EventEmitterMap = {
    MouseEvent: [x: number, y: number, type: MouseEventType];
    CursorPosition: [y: number];
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
    layoutChange?: boolean;
};

export type ViewportStyle = keyof Pick<
    BaseStyle,
    "height" | "width" | "minHeight" | "minWidth"
>;

export type StyleHandler<T extends BaseStyle> = ({
    focus,
    shallowFocus,
}: {
    focus: boolean;
    shallowFocus: boolean;
}) => T;

export type VisualNodeMap = Map<
    DomElement,
    {
        up?: DomElement;
        down?: DomElement;
        left?: DomElement;
        right?: DomElement;
        xArr?: DomElement[];
        yArr?: DomElement[];
        xIdx?: number;
        yIdx?: number;
    }
>;
