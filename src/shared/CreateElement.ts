import { throwError } from "./ThrowError.js";
import { Root } from "../dom/Root.js";
import { BoxElement } from "../dom/BoxElement.js";
import { TextElement } from "../dom/TextElement.js";
import { ListElement } from "../dom/ListElement.js";
import { LayoutElement, LayoutNode } from "../dom/LayoutElement.js";
import type { RuntimeConfig } from "../Types.js";
import { PagesElement } from "../dom/PagesElement.js";

type TagMap = {
    box: BoxElement;
    text: TextElement;
    list: ListElement;
    root: Root;
    layout: LayoutElement;
    layoutnode: LayoutNode;
    pages: PagesElement;
};

type Tag = keyof TagMap;

export function createElement<T extends Tag>(
    tag: T,
    rootConfig?: T extends "root" ? RuntimeConfig : undefined,
): TagMap[T] {
    if (tag === "box") {
        return new BoxElement() as TagMap[T];
    }
    if (tag === "text") {
        return new TextElement() as TagMap[T];
    }
    if (tag === "list") {
        return new ListElement() as TagMap[T];
    }
    if (tag === "layout") {
        return new LayoutElement() as TagMap[T];
    }
    if (tag === "layoutnode") {
        return new LayoutNode() as TagMap[T];
    }
    if (tag === "pages") {
        return new PagesElement() as TagMap[T];
    }
    if (tag === "root") {
        return new Root(rootConfig ?? {}) as TagMap[T];
    }
    throwError(null, "Invalid tagname");
}
