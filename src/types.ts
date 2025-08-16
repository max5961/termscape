import { configureStdin } from "term-keymap";
import { TagNames } from "./constants.js";
import { type MouseEventType } from "./dom/MouseEvent.js";

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
