import Yoga from "yoga-wasm-web/auto";
import { YogaNode } from "../types.js";
import { Event, EventHandler, MouseEvent } from "./MouseEvent.js";
import { Root } from "./Root.js";
import type { DOMRect, TTagNames, Style } from "../types.js";

/** For accessing private members in trusted private package modules */
export type FriendDomElement = {
    // !!! This are changed to DomElement[] in DomElement
    children: FriendDomElement[];

    root: null | Root;
    tagName: TTagNames;
    node: YogaNode;
    parentElement: null | DomElement;
    eventListeners: Record<MouseEvent, Set<EventHandler>>;
    rect: DOMRect;
    attributes: Map<string, unknown>;
    style: Style;

    containsPoint: (x: number, y: number) => boolean;
    executeListeners: (event: MouseEvent) => void;
};

export abstract class DomElement {
    public children: DomElement[];

    public node: FriendDomElement["node"];
    public parentElement: FriendDomElement["parentElement"];
    private rect: FriendDomElement["rect"];
    private eventListeners: FriendDomElement["eventListeners"];
    private attributes: FriendDomElement["attributes"];

    public abstract tagName: FriendDomElement["tagName"];
    public abstract style: FriendDomElement["style"];

    constructor() {
        this.node = Yoga.Node.create();
        this.children = [];
        this.parentElement = null;
        this.rect = {
            x: -1,
            y: -1,
            top: -1,
            bottom: -1,
            right: -1,
            left: -1,
            width: -1,
            height: -1,
        };

        // Currently for mouse events only
        this.eventListeners = {
            MouseDown: new Set(),
            MouseUp: new Set(),
            RightMouseDown: new Set(),
            RightMouseUp: new Set(),
            Click: new Set(),
            RightClick: new Set(),
            ScrollUp: new Set(),
            ScrollDown: new Set(),
            DoubleClick: new Set(),
            RightDoubleClick: new Set(),
        };

        // Define custom attributes
        this.attributes = new Map();
    }

    public abstract setAttribute(): void;

    public addEventListener(event: MouseEvent, handler: EventHandler): void {
        this.eventListeners[event].add(handler);
    }

    public removeEventListener(event: MouseEvent, handler: EventHandler): void {
        this.eventListeners[event].delete(handler);
    }

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
        return this.rect;
    }

    public containsPoint: FriendDomElement["containsPoint"] = (
        x: number,
        y: number,
    ): boolean => {
        if (x < this.rect.x) return false;
        if (y > this.rect.y) return false;
        if (x > this.rect.right) return false;
        if (y < this.rect.bottom) return false;
        return true;
    };
}
