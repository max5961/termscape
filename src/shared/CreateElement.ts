import { throwError } from "./ThrowError.js";
import { Root } from "../dom/Root.js";
import { BoxElement } from "../dom/BoxElement.js";
import { TextElement } from "../dom/TextElement.js";
import type { RuntimeConfig } from "../Types.js";

type TagMap = {
    box: BoxElement;
    text: TextElement;
    root: Root;
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
    if (tag === "root") {
        return new Root(rootConfig ?? {}) as TagMap[T];
    }
    throwError(null, "Invalid tagname");
}
