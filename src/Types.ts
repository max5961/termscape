import { configureStdin } from "term-keymap";
import { TagNameEnum } from "./Constants.js";
import type { DomElement } from "./dom/DomElement.js";
import type { Style } from "./dom/style/Style.js";
import type { FocusState } from "./dom/shared/FocusNode.js";

export type { Color, BgColor, TextEffect, AnsiStyle } from "ansi-escape-sequences";
export type { Node as YogaNode, Edge } from "yoga-wasm-web/auto";

export type _Omit<T extends object, U extends keyof T> = Omit<T, U>;

export type ExtractUnion<T, U extends T> = U extends T ? U : never;

export type ReqProps<T extends object, U extends keyof T> = T & {
    [P in U]-?: T[P];
};

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

export type Runtime = {
    /** Renders occur at an interval no faster than `debounceMs` ms. */
    debounceMs?: number;
    /** Use terminal's alt screen buffer. Preserve main screen. */
    altScreen?: boolean;
    /** `Ctrl + c` ends the runtime for this Root. */
    exitOnCtrlC?: boolean;
    /** Forces process exit after this Root's runtime ends. Skips `waitUntilExit` promises. */
    exitForcesEndProc?: boolean;
    /** Experimental - rewrites only cells that are diffed from prev rendered output. */
    writeMode?: "cell" | "row" | "refresh";
    /** If this is `false`, runtime can be explictly started at any given time with `Root.startRuntime`. */
    startOnCreate?: boolean;
} & ConfigureStdin;

export type EventPayloadMap = {
    MouseEvent: [x: number, y: number, type: MouseEventType];
    CursorPosition: [y: number];
};

export type MouseEvent = {
    type: MouseEventType;
    clientX: number;
    clientY: number;
    target: DomElement;
    currentTarget: DomElement;
    stopPropagation: () => void;
    stopImmediatePropagation: () => void;
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
    // | "drag"
    | "dragstart"
    | "dragend";
export type FocusEvent = "focus" | "blur" | "shallowfocus" | "shallowblur";
export type ConsoleEvent = "console";

export type Event = MouseEventType | FocusEvent | ConsoleEvent;

export type FocusEventHandler = (state: FocusState) => unknown;
export type MouseEventHandler = (e: MouseEvent) => unknown;
/** CHORE - match this to log-goblin `Data` type */
export type ConsoleEventHandler = (stdout: string) => unknown;

export type EventHandler<T extends Event> = ({
    [_ in MouseEventType]: MouseEventHandler;
} & {
    [_ in FocusEvent]: FocusEventHandler;
} & {
    [_ in ConsoleEvent]: ConsoleEventHandler;
})[T];

export type Stdout = Required<Runtime>["stdout"];
export type Stdin = Required<Runtime>["stdin"];

export type WriteOpts = {
    resize?: boolean;
    capturedOutput?: string;
    screenChange?: boolean;
    layoutChange?: boolean;
    styleChange?: boolean;
};

export type ViewportStyle = keyof Pick<
    Style.All,
    "height" | "width" | "minHeight" | "minWidth"
>;

export type StyleHandler<T extends Style.All> = ({
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
