import Yoga from "yoga-wasm-web/auto";
import { YogaNode } from "../types.js";
import { EventHandler, MouseEvent } from "./MouseEvent.js";
import { Root } from "./Root.js";
import type { DOMRect, TTagNames, Style } from "../types.js";
import { type MouseEventType } from "../stdin/types.js";

export type Helper<T extends keyof DomElement> = T;
export type TupleUpdaterMethods = Helper<
    "appendChild" | "insertBefore" | "removeChild" | "removeParent" | "hide" | "unhide"
>;

/** For accessing private members in trusted private package modules */
export type FriendDomElement = {
    // !!! This are changed to DomElement[] in DomElement
    children: FriendDomElement[];

    root: Root | null;
    isAttached: boolean;
    tagName: TTagNames;
    node: YogaNode;
    parentElement: null | DomElement;
    eventListeners: Record<MouseEventType, Set<EventHandler>>;
    rect: DOMRect;
    attributes: Map<string, unknown>;
    style: Style;
    scheduleRender: Root["scheduleRender"];

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
    #root: FriendDomElement["root"];
    protected isAttached: FriendDomElement["isAttached"];
    public tagName: TTagNames;
    protected scheduleRender: FriendDomElement["scheduleRender"];

    public abstract style: FriendDomElement["style"];

    constructor(
        root: Root | null,
        tagName: TTagNames,
        scheduleRender: Root["scheduleRender"],
    ) {
        this.#root = root;
        this.tagName = tagName;
        this.isAttached = false;
        this.node = Yoga.Node.create();
        this.children = [];
        this.parentElement = null;
        this.scheduleRender = scheduleRender;
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
            // LEFT BTN
            click: new Set(),
            dblclick: new Set(),
            mousedown: new Set(),
            mouseup: new Set(),

            // RIGHT BTN
            rightclick: new Set(),
            rightdblclick: new Set(),
            rightmousedown: new Set(),
            rightmouseup: new Set(),

            // SCROLL WHEEL
            scrollup: new Set(),
            scrolldown: new Set(),
            scrollclick: new Set(),
            scrolldblclick: new Set(),
            scrollbtndown: new Set(),
            scrollbtnup: new Set(),

            // MOVEMENT
            mousemove: new Set(),
            drag: new Set(),
            dragstart: new Set(),
            dragend: new Set(),
        };

        // Define custom attributes
        this.attributes = new Map();

        this.wrapAutoRender([
            "appendChild",
            "insertBefore",
            "removeChild",
            "removeParent",
            "hide",
            "unhide",
        ]);
    }

    public abstract setAttribute(): void;

    private wrapAutoRender(methods: TupleUpdaterMethods[]) {
        for (const method of methods) {
            const original = this[method] as (...args: any[]) => any;
            if (typeof original === "function") {
                (this[method] as (...args: any[]) => any) = (...args) => {
                    original.apply(this, args);
                    this.scheduleRender({ resize: true });
                };
            }
        }
    }

    public addEventListener(event: MouseEventType, handler: EventHandler): void {
        this.eventListeners[event].add(handler);
    }

    public removeEventListener(event: MouseEventType, handler: EventHandler): void {
        this.eventListeners[event].delete(handler);
    }

    public appendChild(child: DomElement): void {
        this.exitIfRootMismatch(
            child,
            "Cannot append child created by one root into another root",
        );

        this.node.insertChild(child.node, this.node.getChildCount());
        this.children.push(child);
        child.parentElement = this;

        this.updateAttachState(child, true);
    }

    public insertBefore(child: DomElement, beforeChild: DomElement): void {
        this.exitIfRootMismatch(
            child,
            "Cannot insert child created by one root into another root",
        );

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

        this.updateAttachState(child, true);
    }

    public removeParent(): void {
        const parent = this.parentElement;
        parent?.removeChild(this);
        this.parentElement = null;
    }

    public removeChild(child: DomElement): void {
        const idx = this.children.findIndex((el) => el === child);
        child.removeParent();
        this.children.splice(idx, 1);
        this.node.removeChild(child.node);
        child.node.freeRecursive();

        this.updateAttachState(child, false);
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
        if (y < this.rect.y) return false;
        if (x >= this.rect.right) return false;
        if (y >= this.rect.bottom) return false;
        return true;
    };

    public get root(): Root {
        return this.#root ?? (this as unknown as Root);
    }

    protected exitIfRootMismatch(element: DomElement, msg: string) {
        const root = this.root;
        if (root !== element.root) {
            root.endRuntime(new Error(msg));
        }
    }

    protected updateAttachState(elem: DomElement, attach: boolean): void {
        const shouldAttach = this.shouldAttach() && attach;

        const handler = (elem: DomElement) => (elem.isAttached = shouldAttach);

        if (elem instanceof Root) {
            for (const child of elem.children) {
                this.dfs(child, handler);
            }
        } else {
            this.dfs(this, handler);
        }
    }

    /** Is this the root or an element already part of the root tree? */
    protected shouldAttach() {
        if (this.root) {
            return this.isAttached;
        } else {
            return true;
        }
    }

    protected dfs(startNode: DomElement, cb: (elem: DomElement) => void): void {
        cb(startNode);
        startNode.children.forEach((child) => {
            this.dfs(child, cb);
        });
    }
}
