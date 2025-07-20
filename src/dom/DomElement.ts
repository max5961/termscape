import Yoga from "yoga-wasm-web/auto";
import { YogaNode } from "../util/types.js";
import { EventHandler, MouseEvent } from "./MouseEvent.js";
import type { DOMRect, TTagNames, Style } from "./dom-types.js";

/** For accessing private members in trusted private package modules */
export type FriendDomElement = {
    tagName: TTagNames;
    node: YogaNode;
    children: DomElement[];
    parentElement: null | DomElement;
    eventListeners: Map<MouseEvent, EventHandler>;
    rect: DOMRect | null;
    attributes: Map<string, unknown>;
    style: Style;
};

export abstract class DomElement {
    public tagName!: FriendDomElement["tagName"]; // set in implementation classes
    public node: FriendDomElement["node"];
    public children: FriendDomElement["children"];
    public parentElement: FriendDomElement["parentElement"];
    private eventListeners: FriendDomElement["eventListeners"];
    private rect: FriendDomElement["rect"];
    private attributes: FriendDomElement["attributes"];
    public style: FriendDomElement["style"];

    constructor() {
        this.node = Yoga.Node.create();
        this.children = [];
        this.parentElement = null;
        this.rect = null;

        // Maps
        this.eventListeners = new Map();
        this.attributes = new Map();

        // Constant Attributes
        this.style = {};
    }

    public abstract setAttribute(): void;
    public abstract addEventListener(): void;

    public appendChild(child: DomElement): void {
        this.node.insertChild(child.node, this.node.getChildCount());
        this.children.push(child);
        child.parentElement = this;
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
        child.parentElement = this;
    }

    public removeParent(): void {
        this.parentElement = null;
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

    public getYogaChildren(): YogaNode[] {
        const count = this.node.getChildCount();
        let yogaNodes = [] as YogaNode[];
        for (let i = 0; i < count; ++i) {
            yogaNodes.push(this.node.getChild(i));
        }
        return yogaNodes;
    }

    public getBoundingClientRect(): DOMRect {
        return this.rect!;
    }
}
