import type { BookElement } from "./dom/BookElement.js";
import type { BoxElement } from "./dom/BoxElement.js";
import type { CanvasElement } from "./dom/CanvasElement.js";
import type { FocusManager } from "./dom/FocusManager.js";
import type { LayoutElement, LayoutNode } from "./dom/LayoutElement.js";
import type { ListElement } from "./dom/ListElement.js";
import type { VirtualList } from "./dom/VirtualListElement.js";
import type { Root } from "./dom/RootElement.js";
import type { TestRoot } from "./testing/TestRoot.js";
import type { TextElement, TextNode } from "./dom/TextElement.js";
import type { DomElement } from "./dom/DomElement.js";
import type { BgColor } from "ansi-escape-sequences";
import type { Color, TextEffect } from "./Types.js";
import type { Style } from "./dom/style/Style.js";
import type { InputElement } from "./dom/InputElement.js";
import Yoga from "yoga-wasm-web/auto";

export const Yg = Yoga;

export const TEXT_PADDING = Symbol.for("termscape.padding_text");
export const HIDDEN_TRIMMED_WS = Symbol.for("termscape.hidden_trimmed_ws");
export const WIDE_CHAR_TRAIL = Symbol.for("termscape.wide_char_trail");

export const DOM_ELEMENT = Symbol.for("termscape.dom_element");
export const BOX_ELEMENT = Symbol.for("termscape.box_element");
export const TEXT_ELEMENT = Symbol.for("termscape.text_element");
export const TEXT_NODE = Symbol.for("termscape.text_node");
export const BOOK_ELEMENT = Symbol.for("termscape.book_element");
export const CANVAS_ELEMENT = Symbol.for("termscape.canvas_element");
export const LAYOUT_ELEMENT = Symbol.for("termscape.layout_element");
export const LAYOUT_NODE = Symbol.for("termscape.layout_node");
export const LIST_ELEMENT = Symbol.for("termscape.list_element");
export const VIRTUAL_LIST_ELEMENT = Symbol.for("termscape.virtual_list_element");
export const FOCUS_MANAGER = Symbol.for("termscape.focus_manager");
export const ROOT_ELEMENT = Symbol.for("termscape.root_element");
export const TEST_ROOT_ELEMENT = Symbol.for("termscape.test_root_element");
export const INPUT_ELEMENT = Symbol.for("termscape.input_element");

export const TagNameIdentityMap = {
    root: ROOT_ELEMENT,
    box: BOX_ELEMENT,
    text: TEXT_ELEMENT,
    book: BOOK_ELEMENT,
    canvas: CANVAS_ELEMENT,
    layout: LAYOUT_ELEMENT,
    list: LIST_ELEMENT,
    input: INPUT_ELEMENT,
    ["text-node"]: TEXT_NODE,
    ["layout-node"]: LAYOUT_NODE,
    ["focus-manager"]: FOCUS_MANAGER,
    ["virtual-list"]: VIRTUAL_LIST_ELEMENT,
} as const;

export type ElementIdentityMap = {
    [DOM_ELEMENT]: DomElement;
    [BOX_ELEMENT]: BoxElement;
    [TEXT_ELEMENT]: TextElement;
    [TEXT_NODE]: TextNode;
    [BOOK_ELEMENT]: BookElement;
    [CANVAS_ELEMENT]: CanvasElement;
    [LAYOUT_ELEMENT]: LayoutElement;
    [LAYOUT_NODE]: LayoutNode;
    [LIST_ELEMENT]: ListElement;
    [VIRTUAL_LIST_ELEMENT]: VirtualList;
    [FOCUS_MANAGER]: FocusManager;
    [ROOT_ELEMENT]: Root;
    [TEST_ROOT_ELEMENT]: TestRoot;
    [INPUT_ELEMENT]: InputElement;
};

export const TagNameEnum = {
    Box: "box",
    Text: "text",
    Root: "root",
    List: "list",
    VirtualList: "virtual-list",
    Layout: "layout",
    LayoutNode: "layout-node",
    Book: "book",
    Canvas: "canvas",
    Input: "input",
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

export const TextStyleSet = new Set<keyof Style.Text>([
    "color",
    "backgroundColor",
    "italic",
    "bold",
    "dimColor",
    "underline",
    "imagePositive",
    "imageNegative",
    "fontDefault",
    "font1",
    "font2",
    "font3",
    "font4",
    "font5",
    "font6",
]);
