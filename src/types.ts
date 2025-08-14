import { configureStdin } from "term-keymap";
import { TagNames } from "./constants.js";
import { type BoxStyle } from "./dom/elements/attributes/box/BoxStyle.js";
import { type TextStyle } from "./dom/elements/attributes/text/TextStyle.js";
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
export type Style = BoxStyle & TextStyle;

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
    debounceMs?: number;
    altScreen?: boolean;
    exitOnCtrlC?: boolean;
    exitForcesEndProc?: boolean;
} & ConfigureStdin;
