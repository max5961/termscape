import { BgColor } from "ansi-escape-sequences";
import { Color, TextEffect } from "./types.js";

/**
 * @link https://vt100.net/docs/vt510-rm/DECRPM.html
 * @link https://hugotunius.se/2019/12/29/efficient-terminal-drawing-in-rust.html
 * */
export const BEGIN_SYNCHRONIZED_UPDATE = "\x1b[?2026h";
/**
 * @link https://vt100.net/docs/vt510-rm/DECRPM.html
 * @link https://hugotunius.se/2019/12/29/efficient-terminal-drawing-in-rust.html
 * */
export const END_SYNCHRONIZED_UPDATE = "\x1b[?2026l";
/**
 * @link https://vt100.net/docs/vt510-rm/DECRPM.html
 * @link https://hugotunius.se/2019/12/29/efficient-terminal-drawing-in-rust.html
 * */
export const QUERY_SYNCHRONIZED_UPDATE = "\x1b[?2026$p";

export const TagNames = {
    Box: "BOX_ELEMENT",
    Text: "TEXT_ELEMENT",
    Root: "ROOT_ELEMENT",
} as const;

export const TextEffectSet = new Set<TextEffect>([
    "underline",
    "bold",
    "italic",
    "imageNegative",
    "imagePositive",
    "font1",
    "font2",
    "font3",
    "font4",
    "font5",
    "font6",
    "fontDefault",
]);

export const ColorSet = new Set<Color>([
    "black",
    "red",
    "green",
    "yellow",
    "blue",
    "magenta",
    "cyan",
    "white",
    "grey",
    "gray",
    "brightRed",
    "brightGreen",
    "brightYellow",
    "brightBlue",
    "brightMagenta",
    "brightCyan",
    "brightWhite",
]);

export const BgColorSet = new Set<BgColor>([
    "bg-black",
    "bg-red",
    "bg-green",
    "bg-yellow",
    "bg-blue",
    "bg-magenta",
    "bg-cyan",
    "bg-white",
    "bg-grey",
    "bg-gray",
    "bg-brightRed",
    "bg-brightGreen",
    "bg-brightYellow",
    "bg-brightBlue",
    "bg-brightMagenta",
    "bg-brightCyan",
    "bg-brightWhite",
]);
