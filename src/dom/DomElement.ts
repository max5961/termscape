import Yoga from "yoga-wasm-web/auto";
import { type DOMRect, type TTagNames, type YogaNode } from "../types.js";
import { type Action } from "term-keymap";
import {
    type MouseEvent,
    type MouseEventType,
    type MouseEventHandler,
} from "./MouseEvent.js";
import { Root } from "./Root.js";
import { Render } from "./decorators.js";
import { type ShadowStyle, type VirtualStyle } from "../style/Style.js";
import { createVirtualStyleProxy } from "../style/StyleProxy.js";
import { objectKeys } from "../util/objectKeys.js";

/** Internal access symbol */
export const DOM_ELEMENT_SHADOW_STYLE = Symbol.for("termscape.domelement.shadow_style");
/** Internal access symbol */
export const DOM_ELEMENT_RECT = Symbol.for("termscape.domelement.rect");

export abstract class DomElement {
    public abstract tagName: TTagNames;
    public node: YogaNode;
    public parentElement: null | DomElement;
    public focus: boolean;
    public children: DomElement[];

    protected readonly rootRef: { root: Root | null };
    protected rect: DOMRect;
    protected attributes: Map<string, unknown>;
    protected eventListeners: Record<MouseEventType, Set<MouseEventHandler>>;
    protected actions: Set<Action>;
    protected requiresStdin: boolean;
    protected virtualStyle!: VirtualStyle;
    protected shadowStyle!: ShadowStyle;
    protected removeKeyListeners: (() => void)[];

    constructor() {
        this.node = Yoga.Node.create();
        this.parentElement = null;
        this.focus = false;
        this.children = [];

        this.rootRef = { root: null };
        this.rect = this.initRect();
        this.attributes = new Map();
        this.eventListeners = this.initEventListeners();
        this.actions = new Set();
        this.requiresStdin = false;

        const { virtualStyle, shadowStyle } = createVirtualStyleProxy(
            this.node,
            this.rootRef,
        );

        this.virtualStyle = virtualStyle;
        this.shadowStyle = shadowStyle;

        this.removeKeyListeners = [];
    }

    get [DOM_ELEMENT_SHADOW_STYLE]() {
        return this.shadowStyle;
    }

    get [DOM_ELEMENT_RECT]() {
        return this.rect;
    }

    set [DOM_ELEMENT_RECT](rect: DOMRect) {
        this.rect = rect;
    }

    // ========================================================================
    // Auto Render Proxy
    // ========================================================================

    set style(stylesheet: VirtualStyle) {
        const keys = [...objectKeys(stylesheet), ...objectKeys(this.style)];

        for (const key of keys) {
            (this.style[key] as any) = stylesheet[key];
        }

        const root = this.getRoot();
        if (root) {
            root.scheduleRender();
        }
    }

    get style(): VirtualStyle {
        return this.virtualStyle;
    }

    // ========================================================================
    // TREE MANIPULATION METHODS
    // ========================================================================

    protected afterAttached(): void {
        const root = this.getRoot();
        if (!root) return;

        this.dfs(this, (elem) => {
            elem.setRoot(root);

            elem.actions.forEach((action) => {
                root.addKeyListener(action);
            });

            if (elem.requiresStdin) {
                root.listenStdin();
            }
        });
    }

    protected beforeDetach(): void {
        const root = this.getRoot();

        this.dfs(this, (elem) => {
            // Unset any root references
            elem.setRoot(null);

            if (root) {
                elem.actions.forEach((action) => {
                    root.removeKeyListener(action);
                });
            }
        });
    }

    @Render()
    public appendChild(child: DomElement): void {
        this.node.insertChild(child.node, this.node.getChildCount());
        this.children.push(child);
        child.parentElement = this;
        const root = this.getRoot();
        child.setRoot(root);
        child.afterAttached();
    }

    @Render()
    public insertBefore(child: DomElement, beforeChild: DomElement): void {
        const idx = this.children.findIndex((el) => el === beforeChild);

        if (idx === -1) {
            throw new Error(
                "Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.",
            );
        }

        const nextChildren = [] as DomElement[];
        for (let i = 0; i < this.children.length; ++i) {
            if (i === idx) {
                nextChildren.push(child);
            }
            nextChildren.push(this.children[i]);
        }

        this.children = nextChildren;
        this.node.insertChild(child.node, idx);
        child.parentElement = this;
        const root = this.getRoot();
        child.setRoot(root);

        child.afterAttached();
    }

    @Render()
    public removeChild(child: DomElement, freeRecursive?: boolean) {
        const idx = this.children.findIndex((el) => el === child);

        if (idx === -1) {
            throw new Error(
                "Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.",
            );
        }

        child.beforeDetach();

        this.children.splice(idx, 1);
        this.node.removeChild(child.node);

        // If React removes a child, it should be gc'd.  If removing w/o React,
        // its possible that the child and its children may be used later, so
        // freeRecursive should be optional.
        if (freeRecursive) {
            child.node.freeRecursive();
        }

        child.parentElement = null;
        child.setRoot(null);
    }

    @Render()
    public removeParent() {
        this.parentElement?.removeChild(this as unknown as DomElement);
    }

    // ========================================================================
    // Reconciler                                                           //
    // ========================================================================

    @Render()
    public hide(): void {
        this.node.setDisplay(Yoga.DISPLAY_NONE);
    }

    @Render()
    public unhide(): void {
        this.node.setDisplay(Yoga.DISPLAY_FLEX);
    }

    public getYogaChildren(): YogaNode[] {
        const count = this.node.getChildCount();
        const yogaNodes = [] as YogaNode[];
        for (let i = 0; i < count; ++i) {
            yogaNodes.push(this.node.getChild(i));
        }
        return yogaNodes;
    }

    // ========================================================================
    // DOMRects
    // ========================================================================

    private initRect() {
        return {
            x: -1,
            y: -1,
            top: -1,
            bottom: -1,
            right: -1,
            left: -1,
            width: -1,
            height: -1,
        };
    }

    public getBoundingClientRect(): DOMRect {
        return this.rect;
    }

    public containsPoint(x: number, y: number): boolean {
        if (x < this.rect.x) return false;
        if (y < this.rect.y) return false;
        if (x >= this.rect.right) return false;
        if (y >= this.rect.bottom) return false;
        return true;
    }

    // ========================================================================
    // Mouse Events
    // ========================================================================

    private initEventListeners<
        T = DomElement["eventListeners"][keyof DomElement["eventListeners"]],
    >() {
        return {
            // LEFT BTN
            click: new Set<T>(),
            dblclick: new Set<T>(),
            mousedown: new Set<T>(),
            mouseup: new Set<T>(),

            // RIGHT BTN
            rightclick: new Set<T>(),
            rightdblclick: new Set<T>(),
            rightmousedown: new Set<T>(),
            rightmouseup: new Set<T>(),

            // SCROLL WHEEL
            scrollup: new Set<T>(),
            scrolldown: new Set<T>(),
            scrollclick: new Set<T>(),
            scrolldblclick: new Set<T>(),
            scrollbtndown: new Set<T>(),
            scrollbtnup: new Set<T>(),

            // MOVEMENT
            mousemove: new Set<T>(),
            drag: new Set<T>(),
            dragstart: new Set<T>(),
            dragend: new Set<T>(),
        };
    }

    public addEventListener(event: MouseEventType, handler: MouseEventHandler): void {
        this.requiresStdin = true;
        this.eventListeners[event].add(handler);

        const root = this.getRoot();
        if (root) {
            root.listenStdin();
        }
    }

    public removeEventListener(event: MouseEventType, handler: MouseEventHandler): void {
        this.eventListeners[event].delete(handler);
    }

    protected propagateMouseEvent(
        x: number,
        y: number,
        type: MouseEventType,
        target: DomElement,
    ) {
        let canPropagate = true;
        let canImmediatePropagate = true;

        const propagate = (curr: DomElement, target: DomElement) => {
            if (curr && curr.eventListeners[type].size) {
                const handlers = curr.eventListeners[type];

                const event: MouseEvent = {
                    type,
                    clientX: x,
                    clientY: y,
                    target: target,
                    currentTarget: curr,
                    stopPropagation: () => {
                        canPropagate = false;
                    },
                    stopImmediatePropagation: () => {
                        canImmediatePropagate = false;
                        canPropagate = false;
                    },
                };

                handlers.forEach((h) => {
                    if (canImmediatePropagate) {
                        h.call(curr, event);
                    }
                });
            }

            if (canPropagate && curr.parentElement) {
                propagate(curr.parentElement, target);
            }
        };

        propagate(target, target);
    }

    // ========================================================================
    // Keymap Events
    // ========================================================================

    public addKeyListener(action: Action): () => void {
        this.requiresStdin = true;

        const origCb = action.callback;
        action.callback = () => {
            if (this.focus) {
                origCb?.();
            }
        };

        this.actions.add(action);
        const root = this.getRoot();
        root?.addKeyListener(action); // Root overrides `addKeyListener`
        return () => {
            this.removeKeyListener(action);

            // Just in case this element is detached, and added to a different Root.
            this.getRoot()?.removeKeyListener(action);
        };
    }

    public removeKeyListener(action: Action): void {
        this.actions.delete(action);
        const root = this.getRoot();
        root?.removeKeyListener(action);
    }

    // ========================================================================
    // Util
    // ========================================================================

    protected getRoot(): Root | null {
        return this.rootRef.root;
    }

    protected setRoot(root: Root | null): void {
        this.rootRef.root = root;
    }

    private dfs(elem: DomElement, cb: (elem: DomElement) => void) {
        cb(elem);
        elem.children.forEach((child) => {
            this.dfs(child, cb);
        });
    }

    private reverseDfs<T>(
        elem: DomElement | null,
        cb: (elem: DomElement, stop: () => void) => T,
    ): T | undefined {
        if (!elem) {
            return;
        }

        let broken = false;
        const stop = () => {
            broken = true;
        };
        const result = cb(elem, stop);

        return broken ? result : this.reverseDfs(elem.parentElement, cb);
    }
}
