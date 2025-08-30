import { type BgColor } from "ansi-escape-sequences";
import { type Color, type TextEffect } from "./Types.js";
import Yoga from "yoga-wasm-web/auto";

export const Yg = Yoga;

export const TagNames = {
    Box: "BOX_ELEMENT",
    Text: "TEXT_ELEMENT",
    Root: "ROOT_ELEMENT",
    List: "LIST_ELEMENT",
    Layout: "LAYOUT_ELEMENT",
    LayoutNode: "LAYOUT_NODE",
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
