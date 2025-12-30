import type { BoxElement } from "../dom/BoxElement.js";
import type { LayoutElement, LayoutNode } from "../dom/LayoutElement.js";
import type { ListElement } from "../dom/ListElement.js";
import type { BookElement } from "../dom/BookElement.js";
import type { InputElement } from "../dom/InputElement.js";

export type BoxLike =
    | BoxElement
    | LayoutNode
    | LayoutElement
    | ListElement
    | BookElement
    | InputElement;
