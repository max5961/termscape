import { objectKeys } from "../Util.js";
import type { Runtime, StyleHandler } from "../Types.js";
import type { Props } from "../dom/props/Props.js";
import type { Style } from "../dom/style/Style.js";
import { DomElement } from "../dom/DomElement.js";
import { Root } from "../dom/RootElement.js";
import { BoxElement } from "../dom/BoxElement.js";
import { TextElement } from "../dom/TextElement.js";
import { ListElement } from "../dom/ListElement.js";
import { LayoutElement, LayoutNode } from "../dom/LayoutElement.js";
import { BookElement } from "../dom/BookElement.js";
import { CanvasElement } from "../dom/CanvasElement.js";
import { VirtualList } from "../dom/VirtualListElement.js";
import { InputElement } from "../dom/InputElement.js";

type StyleHelper<T extends Style.All> = T | StyleHandler<T>;
type Children = DomElement[];
type Config<S extends Style.All, P extends Props.All> = {
    children?: Children;
    style?: StyleHelper<S>;
    props?: P;
};

function applyConfig(elem: DomElement, config: any): void {
    if (!config) return;
    const cfg = config as Config<Style.All, Props.All>;

    if (cfg.style) {
        elem.style = cfg.style;
    }

    if (cfg.props) {
        for (const prop of objectKeys(cfg.props)) {
            elem.setProp(prop, cfg.props[prop]);
        }
    }

    if (cfg.children) {
        cfg.children.forEach((child) => elem.appendChild(child));
    }
}

export const create = {
    root: (config?: Runtime) => {
        return new Root(config ?? {});
    },
    box: (config?: Config<Style.Box, Props.Box>) => {
        const elem = new BoxElement();
        applyConfig(elem, config);
        return elem;
    },
    text: (config: Config<Style.Text, Props.Text> & { textContent: string }) => {
        const elem = new TextElement();
        applyConfig(elem, config);
        elem.textContent = config.textContent;
        return elem;
    },
    list: (config?: Config<Style.List, Props.List>) => {
        const elem = new ListElement();
        applyConfig(elem, config);
        return elem;
    },
    layout: (config?: Config<Style.Layout, Props.Layout>) => {
        const elem = new LayoutElement();
        applyConfig(elem, config);
        return elem;
    },
    layoutNode: (config?: Config<Style.LayoutNode, Props.LayoutNode>) => {
        const elem = new LayoutNode();
        applyConfig(elem, config);
        return elem;
    },
    book: (config?: Config<Style.Book, Props.Book>) => {
        const elem = new BookElement();
        applyConfig(elem, config);
        return elem;
    },
    canvas: (
        config: Config<Style.Canvas, Props.Canvas> & {
            props: { draw: Props.Canvas["draw"] };
        },
    ) => {
        const elem = new CanvasElement();
        applyConfig(elem, config);
        return elem;
    },
    input: (config?: Config<Style.Input, Props.Input>) => {
        const elem = new InputElement();
        applyConfig(elem, config);
        return elem;
    },
    virtualList: <Data>(
        config: Config<Style.List, Props.VirtualList<Data>> & {
            props: {
                data: Props.VirtualList<Data>["data"];
                renderItem: Props.VirtualList<Data>["renderItem"];
            };
        },
    ) => {
        const elem = new VirtualList<Data>(config.props);
        applyConfig(elem, config);
        return elem;
    },
} as const;
