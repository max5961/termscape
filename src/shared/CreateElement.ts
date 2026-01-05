import { throwError } from "./ThrowError.js";
import { objectKeys } from "../Util.js";
import type { RuntimeConfig, StyleHandler } from "../Types.js";
import type { Props } from "../dom/props/Props.js";
import type { Style } from "../dom/style/Style.js";
import type { DomElement } from "../dom/DomElement.js";
import { Root } from "../dom/RootElement.js";
import { BoxElement } from "../dom/BoxElement.js";
import { TextElement } from "../dom/TextElement.js";
import { ListElement } from "../dom/ListElement.js";
import { LayoutElement, LayoutNode } from "../dom/LayoutElement.js";
import { BookElement } from "../dom/BookElement.js";
import { CanvasElement } from "../dom/CanvasElement.js";

type RequiredConfig<Style extends Style.All, Props extends Props.All> = {
    style?: Style | StyleHandler<Style>;
    children?: DomElement[];
    props: Props;
};

type OptionalConfig<Style extends Style.All, Props extends Props.All> =
    | undefined
    | {
          style?: Style | StyleHandler<Style>;
          children?: DomElement[];
          props?: Props;
      };

type TagMap = {
    root: {
        config: undefined | RuntimeConfig;
        return: Root;
    };
    box: {
        config: OptionalConfig<Style.Box, Props.Box>;
        return: BoxElement;
    };
    text: {
        config: OptionalConfig<Style.Text, Props.Text> & { textContent?: string };
        return: TextElement;
    };
    list: {
        config: OptionalConfig<Style.List, Props.List>;
        return: ListElement;
    };
    layout: {
        config: OptionalConfig<Style.Layout, Props.Layout>;
        return: LayoutElement;
    };
    layoutNode: {
        config: OptionalConfig<Style.LayoutNode, Props.LayoutNode>;
        return: LayoutNode;
    };
    book: {
        config: OptionalConfig<Style.Book, Props.Book>;
        return: BookElement;
    };
    canvas: {
        config: OptionalConfig<Style.Canvas, Props.Canvas>;
        return: CanvasElement;
    };
};

type ExtendsUndef<T> = T extends undefined ? T : never;

type RequiredTagMap = {
    [P in keyof TagMap]: ExtendsUndef<TagMap[P]["config"]> extends never ? P : never;
}[keyof TagMap];

type ConfigHelper<Style extends Style.All, Props extends Props.All> = {
    style?: Style | StyleHandler<Style>;
    children?: DomElement[];
    props?: Props;
};

type Tags = keyof TagMap;
type Config<T extends Tags> = TagMap[T]["config"];
type Return<T extends Tags> = TagMap[T]["return"];
type DefaultConfig = ConfigHelper<Style.All, Props.All>;

export function createElement<T extends Tags>(
    tag: T,
    ...config: T extends RequiredTagMap ? [Config<T>] : [Config<T>?]
): Return<T> {
    const cfg = config[0] as DefaultConfig;
    if (tag === "box") {
        const box = new BoxElement();
        applyConfig(box, cfg);
        return box;
    }
    if (tag === "text") {
        const text = new TextElement();
        applyConfig(text, cfg);
        const textContent = (cfg as TagMap["text"]["config"]).textContent;
        if (textContent) {
            text.textContent = textContent;
        }
        return text;
    }
    if (tag === "book") {
        const pages = new BookElement();
        applyConfig(pages, cfg);
        return pages;
    }
    if (tag === "list") {
        const list = new ListElement();
        applyConfig(list, cfg);
        return list;
    }
    if (tag === "layout") {
        const layout = new LayoutElement();
        applyConfig(layout, cfg);
        return layout;
    }
    if (tag === "layoutNode") {
        const layoutNode = new LayoutNode();
        applyConfig(layoutNode, cfg);
        return layoutNode;
    }
    if (tag === "root") {
        const runtimeConfig = config[0] as Config<"root">;
        return new Root(runtimeConfig ?? {});
    }
    if (tag === "canvas") {
        const canvas = new CanvasElement();
        applyConfig(canvas, cfg);
        return canvas;
    }

    throwError(undefined, "Invalid tagname.");
}

function applyConfig(elem: DomElement, config: DefaultConfig): void {
    if (!config) return;

    if (config.style) {
        elem.style = config.style;
    }

    if (config.props) {
        for (const prop of objectKeys(config.props)) {
            elem.setProp(prop, config.props[prop]);
        }
    }

    if (config.children) {
        config.children.forEach((child) => elem.appendChild(child));
    }
}
