import Yoga from "yoga-wasm-web/auto";
import { YogaNode } from "../util/types.js";
import { BoxProps } from "./elements/attributes/box/BoxProps.js";
import { TextProps } from "./elements/attributes/text/TextProps.js";
import { BoxMetaData } from "./elements/attributes/box/BoxMetaData.js";
import { TextMetaData } from "./elements/attributes/text/TextMetaData.js";
import { Event, EventHandler, MouseEvent } from "./MouseEvent.js";

export const TagNames = {
    Box: "BOX_ELEMENT",
    Text: "TEXT_ELEMENT",
} as const;

export type TTagName = typeof TagNames.Box | typeof TagNames.Text;
export type Props = BoxProps | TextProps;
export type MetaData = (BoxMetaData | TextMetaData) & { ID?: string } & {
    [key: string]: any;
};
export type Point = { x: number; y: number };

export abstract class DomElement {
    public tagname!: TTagName;
    public props: Props;
    public metadata: MetaData;
    public node: YogaNode;
    public children: DomElement[];
    public parentNode: null | DomElement;
    public screenposition: { tl: Point; tr: Point; bl: Point; br: Point };
    protected isRoot: boolean;
    public eventListeners: Map<MouseEvent, EventHandler>;

    constructor() {
        this.node = Yoga.Node.create();
        this.isRoot = false;
        this.props = {};
        this.metadata = {};
        this.children = [];
        this.parentNode = null;
        this.screenposition = {
            tl: { x: 0, y: 0 },
            tr: { x: 0, y: 0 },
            bl: { x: 0, y: 0 },
            br: { x: 0, y: 0 },
        };
        this.eventListeners = new Map();
    }

    public abstract setAttributes(props: Props & MetaData): void;
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

    public updateScreenPosition(sx: number, sy: number): void {
        // TODO: you only *really* need tl.x, tx.y, bl (the y), and tr (the x)

        // TL
        this.screenposition.tl.x = sx;
        this.screenposition.tl.y = sy;

        // TR
        this.screenposition.tr.x =
            this.screenposition.tl.x + this.node.getComputedWidth();
        this.screenposition.tr.y = this.screenposition.tl.y;

        // BL
        this.screenposition.bl.x = this.screenposition.tl.x;
        this.screenposition.bl.y =
            this.screenposition.tl.y + this.node.getComputedHeight();

        // BR
        this.screenposition.br.x = this.screenposition.bl.x;
        this.screenposition.br.y = this.screenposition.tr.x;

        for (const child of this.children) {
            child.updateScreenPosition(
                this.screenposition.tl.x,
                this.screenposition.tl.y,
            );
        }
    }

    // TODO: Handle zindexed nodes which means zindexed nodes will need to be the
    // first to handle and then they will update a cache that invalidates certain
    // positions
    public handleEvent(e: Event, handlers: Record<string, EventHandler[]>): void {
        for (const child of this.children) {
            child.handleEvent(e, handlers);
        }

        if (
            e.clientX < this.screenposition.tl.x ||
            e.clientX > this.screenposition.tr.x ||
            e.clientY < this.screenposition.tl.y ||
            e.clientY > this.screenposition.bl.y
        ) {
            return;
        }

        const h = this.eventListeners.get(e.type);
        if (h) {
            // @ts-expect-error
            handlers[this.props.style.zIndex].push(h);
        }
    }
}
