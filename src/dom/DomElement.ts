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

    // Like element.setAttribute, but for all props provided from the react layer
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
