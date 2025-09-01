import { throwError } from "./ThrowError.js";
import { Root } from "../dom/Root.js";
import { BoxElement } from "../dom/BoxElement.js";
import { TextElement } from "../dom/TextElement.js";
import { ListElement } from "../dom/ListElement.js";
import { LayoutElement, LayoutNode } from "../dom/LayoutElement.js";
import type { DomElement, RuntimeConfig, StyleHandler } from "../Types.js";
import { PagesElement } from "../dom/PagesElement.js";
import type { BaseProps } from "../Props.js";
import type {
    VirtualBoxStyle,
    VirtualLayoutStyle,
    VirtualListStyle,
    VirtualStyle,
    VirtualTextStyle,
} from "../style/Style.js";
import { objectKeys } from "../Util.js";
import type { Action } from "term-keymap";

type DefaultConfig<T extends VirtualStyle> = {
    style?: T | StyleHandler<T>;
    children?: DomElement[];
    props?: BaseProps;
    keyListeners?: Action[];
};

type TagMap = {
    root: {
        config: undefined | RuntimeConfig;
        return: Root;
    };
    box: {
        config: undefined | DefaultConfig<VirtualBoxStyle>;
        return: BoxElement;
    };
    text: {
        config: undefined | DefaultConfig<VirtualTextStyle>;
        return: TextElement;
    };
    list: {
        config: undefined | DefaultConfig<VirtualListStyle>;
        return: ListElement;
    };
    layout: {
        config: undefined | DefaultConfig<VirtualLayoutStyle>;
        return: LayoutElement;
    };
    layoutNode: {
        config: undefined | DefaultConfig<VirtualBoxStyle>;
        return: LayoutNode;
    };
    pages: {
        config: undefined | DefaultConfig<VirtualBoxStyle>;
        return: PagesElement;
    };
};

type ExtendsUndef<T> = T extends undefined ? T : never;

type RequiredTagMap = {
    [P in keyof TagMap]: ExtendsUndef<TagMap[P]["config"]> extends never ? P : never;
}[keyof TagMap];

type Tags = keyof TagMap;
type Config<T extends Tags> = TagMap[T]["config"];
type Return<T extends Tags> = TagMap[T]["return"];

export function createElement<T extends Tags>(
    tag: T,
    ...rest: T extends RequiredTagMap ? [Config<T>] : [Config<T>?]
): Return<T> {
    if (tag === "box") {
        const config = rest[0] as Config<"box">;
        const box = new BoxElement();
        if (!config) return box;

        assignDefault(box, config);
        return box;
    }
    if (tag === "text") {
        const config = rest[0] as Config<"text">;
        const text = new TextElement();
        if (!config) return text;

        assignDefault(text, config);
        return text;
    }
    if (tag === "pages") {
        const config = rest[0] as Config<"pages">;
        const pages = new PagesElement();
        if (!config) return pages;

        assignDefault(pages, config);
        return pages;
    }
    if (tag === "list") {
        const config = rest[0] as Config<"list">;
        const list = new ListElement();
        if (!config) return list;

        // Need to make ListElement essentially a Box with props for its settings
        assignDefault(list, config);
        return list;
    }
    if (tag === "layout") {
        const config = rest[0] as Config<"layout">;
        const layout = new LayoutElement();
        if (!config) return layout;

        assignDefault(layout, config);
        return layout;
    }
    if (tag === "layoutNode") {
        const config = rest[0] as Config<"layoutNode">;
        const layoutNode = new LayoutNode();
        if (!config) return layoutNode;

        assignDefault(layoutNode, config);
        return layoutNode;
    }
    if (tag === "root") {
        const config = rest[0] as Config<"root">;
        return new Root(config ?? {});
    }

    throwError(null, "Invalid tagname.");
}

function assignDefault(elem: DomElement, config: Exclude<Config<"box">, undefined>) {
    if (config.style) {
        elem.style = config.style;
    }
    if (config.children) {
        config.children.forEach((child) => elem.appendChild(child));
    }
    if (config.props) {
        for (const prop of objectKeys(config.props)) {
            elem.setProp(prop, config.props[prop]);
        }
    }
}
