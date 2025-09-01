import type { BoxElement } from "../dom/BoxElement.js";
import type { LayoutElement, LayoutNode } from "../dom/LayoutElement.js";
import type { ListElement } from "../dom/ListElement.js";
import type { PagesElement } from "../dom/PagesElement.js";

export type BoxLike =
    | BoxElement
    | LayoutNode
    | LayoutElement
    | ListElement
    | PagesElement;
