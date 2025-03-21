import Yoga, { Node as YogaNode } from "yoga-wasm-web/auto";
import { BoxProps } from "../props/box/BoxProps.js";
import { TextProps } from "../props/text/TextProps.js";

export type TagName = "BOX_ELEMENT" | "TEXT_ELEMENT";
export type Props = BoxProps | TextProps;
export type MetaData = { ID?: string } & { [key: string]: any };
export type Node = YogaNode;

export abstract class DomElement {
    public tagname!: TagName;
    public props: Props;
    public metadata: MetaData;
    public node: Node;

    constructor() {
        this.node = Yoga.Node.create();
        this.metadata = {};
        this.props = {};
    }

    // Like element.setAttribute, but for all props provided from the react layer
    public abstract setProps(props: BoxProps | TextProps): void;
    public abstract addEventListener(): void;
}
