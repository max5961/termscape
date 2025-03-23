import Yoga, { Node as YogaNode } from "yoga-wasm-web/auto";
import { BoxProps } from "../props/box/BoxProps.js";
import { TextProps } from "../props/text/TextProps.js";
import { BoxStyle } from "../props/box/BoxStyle.js";
import { TextStyle } from "../props/text/TextStyle.js";

export const TagNames = {
    Box: "BOX_ELEMENT",
    Text: "TEXT_ELEMENT",
} as const;

export type TTagName = typeof TagNames.Box | typeof TagNames.Text;
export type Props = BoxProps | TextProps;
export type MetaData = { ID?: string } & { [key: string]: any };
export type Node = YogaNode;

export abstract class DomElement {
    public tagname!: TTagName;
    public props: Props;
    public metadata: MetaData;
    public node: Node;
    public children: DomElement[];
    public parentNode: null | DomElement;
    protected isRoot: boolean;

    constructor() {
        this.node = Yoga.Node.create();
        this.isRoot = false;
        this.props = {};
        this.metadata = {};
        this.children = [];
        this.parentNode = null;
    }

    public abstract setStyle(style: BoxStyle | TextStyle): void;
    public abstract setProps(props: BoxProps | TextProps): void;
    public abstract addEventListener(): void;

    public appendChild(child: DomElement): void {
        this.node.insertChild(child.node, this.node.getChildCount());
        this.children.push(child);
        child.parentNode = this;
    }

    public insertBefore(child: DomElement, beforeChild: DomElement): void {
        const nextChildren = [] as DomElement[];
        const idx = this.children.findIndex((el) => el === beforeChild);

        for (let i = 0; i < this.children.length; ++i) {
            if (i === idx) {
                nextChildren.push(child);
            }
            nextChildren.push(this.children[i]);
        }

        this.children = nextChildren;
        this.node.insertChild(child.node, idx);
        child.parentNode = this;
    }

    public removeParent(): void {
        this.parentNode = null;
    }

    public removeChild(child: DomElement): void {
        const idx = this.children.findIndex((el) => el === child);
        child.removeParent();
        this.children.splice(idx, 1);
        this.node.removeChild(child.node);
        child.node.freeRecursive();
    }

    public hide(): void {
        this.node.setDisplay(Yoga.DISPLAY_NONE);
    }

    public unhide(): void {
        this.node.setDisplay(Yoga.DISPLAY_FLEX);
    }

    public getIsRoot(): boolean {
        return this.isRoot;
    }

    public getYogaChildren(): YogaNode[] {
        const count = this.node.getChildCount();
        let yogaNodes = [] as YogaNode[];
        for (let i = 0; i < count; ++i) {
            yogaNodes.push(this.node.getChild(i));
        }
        return yogaNodes;
    }
}
