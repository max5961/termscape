import { throwError } from "./ThrowError.js";
import { objectKeys } from "../Util.js";
import type { DomElement, RuntimeConfig, StyleHandler } from "../Types.js";
import type { BaseProps, Props } from "../Props.js";
import type { BoxStyle, BaseStyle, TextStyle } from "../style/Style.js";
import { Root } from "../dom/Root.js";
import { BoxElement } from "../dom/BoxElement.js";
import { TextElement } from "../dom/TextElement.js";
import { ListElement } from "../dom/ListElement.js";
import { LayoutElement, LayoutNode } from "../dom/LayoutElement.js";
import { PagesElement } from "../dom/PagesElement.js";

type RequiredConfig<Style extends BaseStyle, Props extends BaseProps> = {
    style?: Style | StyleHandler<Style>;
    children?: DomElement[];
    props: Props;
};

type OptionalConfig<Style extends BaseStyle, Props extends BaseProps> =
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
        config: OptionalConfig<BoxStyle, Props.Box>;
        return: BoxElement;
    };
    text: {
        config: OptionalConfig<TextStyle, Props.Text>;
        return: TextElement;
    };
    list: {
        config: OptionalConfig<BoxStyle, Props.List>;
        return: ListElement;
    };
    layout: {
        config: OptionalConfig<BoxStyle, Props.Layout>;
        return: LayoutElement;
    };
    layoutNode: {
        config: OptionalConfig<BoxStyle, Props.LayoutNode>;
        return: LayoutNode;
    };
    pages: {
        config: OptionalConfig<BoxStyle, Props.Pages>;
        return: PagesElement;
    };
};

type ExtendsUndef<T> = T extends undefined ? T : never;

type RequiredTagMap = {
    [P in keyof TagMap]: ExtendsUndef<TagMap[P]["config"]> extends never ? P : never;
}[keyof TagMap];

type ConfigHelper<Style extends BaseStyle, Props extends BaseProps> = {
    style?: Style | StyleHandler<Style>;
    children?: DomElement[];
    props?: Props;
};

type Tags = keyof TagMap;
type Config<T extends Tags> = TagMap[T]["config"];
type Return<T extends Tags> = TagMap[T]["return"];
type DefaultConfig = ConfigHelper<BaseStyle, BaseProps>;

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
        return text;
    }
    if (tag === "pages") {
        const pages = new PagesElement();
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

    throwError(null, "Invalid tagname.");
}

function applyConfig(elem: DomElement, config: DefaultConfig): void {
    if (!config) return;

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
