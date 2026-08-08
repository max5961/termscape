import { BookElement } from "./dom/BookElement.js";
import { BoxElement } from "./dom/BoxElement.js";
import { CanvasElement } from "./dom/CanvasElement.js";
import type { FocusManager } from "./dom/FocusManager.js";
import { LayoutElement, type LayoutNode } from "./dom/LayoutElement.js";
import { ListElement } from "./dom/ListElement.js";
import type { VirtualListElement } from "./dom/VirtualListElement.js";
import type { Root } from "./dom/RootElement.js";
import type { TestRoot } from "./testing/TestRoot.js";
import { TextElement, type TextNode } from "./dom/TextElement.js";
import { DomElement } from "./dom/DomElement.js";
import type { BgColor } from "ansi-escape-sequences";
import type { Color, TextEffect } from "./Types.js";
import type { Style } from "./dom/style/Style.js";
import { InputElement } from "./dom/InputElement.js";
import Yoga from "yoga-wasm-web/auto";
import type { FocusController, IFocusController } from "./dom/shared/FocusController.js";

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
export const FOCUS_CONTROLLER = Symbol.for("termscape.focus_controller");
export const ROOT_ELEMENT = Symbol.for("termscape.root_element");
export const TEST_ROOT_ELEMENT = Symbol.for("termscape.test_root_element");
export const INPUT_ELEMENT = Symbol.for("termscape.input_element");

export type IdentityMap = {
    [DOM_ELEMENT]: DomElement;
    [BOX_ELEMENT]: BoxElement;
    [TEXT_ELEMENT]: TextElement;
    [TEXT_NODE]: TextNode;
    [BOOK_ELEMENT]: BookElement;
    [CANVAS_ELEMENT]: CanvasElement;
    [LAYOUT_ELEMENT]: LayoutElement;
    [LAYOUT_NODE]: LayoutNode;
    [LIST_ELEMENT]: ListElement;
    [VIRTUAL_LIST_ELEMENT]: VirtualListElement;
    [FOCUS_MANAGER]: FocusManager;
    [ROOT_ELEMENT]: Root;
    [TEST_ROOT_ELEMENT]: TestRoot;
    [INPUT_ELEMENT]: InputElement;

    // shared by ListElement and LayoutElement
    [FOCUS_CONTROLLER]: IFocusController;
};

export const TagNameIdentityMap = {
    ["box"]: BOX_ELEMENT,
    ["text"]: TEXT_ELEMENT,
    ["text-node"]: TEXT_NODE,
    ["book"]: BOOK_ELEMENT,
    ["canvas"]: CANVAS_ELEMENT,
    ["layout"]: LAYOUT_ELEMENT,
    ["layout-node"]: LAYOUT_NODE,
    ["list"]: LIST_ELEMENT,
    ["virtual-list"]: VIRTUAL_LIST_ELEMENT,
    ["root"]: ROOT_ELEMENT,
    ["input"]: INPUT_ELEMENT,
} as const;

export const ElementIdentities = {
    DomElement: new Set([DOM_ELEMENT]),
    BoxElement: new Set([BOX_ELEMENT]),
    TextElement: new Set([TEXT_ELEMENT]),
    TextNode: new Set([TEXT_NODE, TEXT_ELEMENT]),
    BookElement: new Set([BOOK_ELEMENT]),
    CanvasElement: new Set([CANVAS_ELEMENT]),
    LayoutElement: new Set([LAYOUT_ELEMENT, FOCUS_CONTROLLER]),
    LayoutNode: new Set([LAYOUT_NODE]),
    ListElement: new Set([LIST_ELEMENT, FOCUS_CONTROLLER]),
    VirtualListElement: new Set([VIRTUAL_LIST_ELEMENT]),
    FocusManager: new Set([FOCUS_MANAGER]),
    Root: new Set([ROOT_ELEMENT]),
    TestRoot: new Set([TEST_ROOT_ELEMENT]),
    InputElement: new Set([INPUT_ELEMENT]),
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
