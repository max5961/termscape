import Yoga from "yoga-wasm-web/auto";
import { type Action } from "term-keymap";
import type {
    MouseEvent,
    MouseEventType,
    MouseEventHandler,
    ShadowStyle,
    VirtualStyle,
    DOMRect,
    TTagNames,
    YogaNode,
} from "../Types.js";
import type { Root } from "./Root.js";
import {
    DOM_ELEMENT_RECT,
    DOM_ELEMENT_SHADOW_STYLE,
    ROOT_BRIDGE_DOM_ELEMENT,
} from "../Symbols.js";
import { Render, RequestInput } from "./util/decorators.js";
import { createVirtualStyleProxy } from "../style/StyleProxy.js";
import { objectKeys } from "../Util.js";
import { ElementMetaData } from "./ElementMetadata.js";
import { throwError } from "../shared/ThrowError.js";

export abstract class DomElement<
    VStyle extends VirtualStyle = VirtualStyle,
    SStyle extends ShadowStyle = ShadowStyle,
> {
    public abstract tagName: TTagNames;
    public node: YogaNode;
    public parentElement: null | DomElement;
    public focus: boolean;
    public children: DomElement[];

    protected readonly rootRef: { root: Root | null };
    protected rect: DOMRect;
    protected attributes: Map<string, unknown>;
    protected eventListeners: Record<MouseEventType, Set<MouseEventHandler>>;
    protected requiresStdin: boolean;
    protected virtualStyle!: VStyle;
    protected shadowStyle!: SStyle;
    protected removeKeyListeners: (() => void)[];
    protected childrenSet: Set<DomElement>;
    protected readonly metadata: ElementMetaData;
    protected readonly baseDefaultStyles: VirtualStyle;
    protected abstract defaultStyles: VStyle;

    constructor() {
        this.node = Yoga.Node.create();
        this.parentElement = null;
        this.focus = true;
        this.children = [];
        this.childrenSet = new Set();

        this.rootRef = { root: null };
        this.rect = this.initRect();
        this.attributes = new Map();
        this.eventListeners = this.initEventListeners();
        this.requiresStdin = false;
        this.metadata = new ElementMetaData(this);

        const { virtualStyle, shadowStyle } = createVirtualStyleProxy<VStyle, SStyle>(
            this.node,
            this.rootRef,
            this.metadata,
        );

        this.virtualStyle = virtualStyle;
        this.shadowStyle = shadowStyle;

        this.removeKeyListeners = [];

        // DEFAULT STYLES
        this.baseDefaultStyles = {
            display: "flex",
            zIndex: "auto",
            overflow: "visible",
            flexDirection: "row",
            flexGrow: 0,
            flexShrink: 1,
        };
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

    set style(stylesheet: VStyle) {
        const withDefault = {
            ...this.baseDefaultStyles,
            ...this.defaultStyles,
            ...stylesheet,
        } as VStyle;

        const keys = [...objectKeys(withDefault), ...objectKeys(this.style)];

        for (const key of keys) {
            this.style[key] = withDefault[key];
        }

        const root = this.getRoot();
        if (root) {
            root.scheduleRender();
        }
    }

    get style(): VStyle {
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

            root[ROOT_BRIDGE_DOM_ELEMENT](elem.metadata, { attached: true });

            if (elem.requiresStdin) {
                root.requestInputStream();
            }
        });
    }

    protected beforeDetaching(): void {
        const root = this.getRoot();

        this.dfs(this, (elem) => {
            elem.setRoot(null);

            if (root) {
                root[ROOT_BRIDGE_DOM_ELEMENT](elem.metadata, { attached: false });
            }
        });
    }

    @Render()
    public appendChild(child: DomElement): void {
        if (this.childrenSet.has(child)) return;
        this.childrenSet.add(child);

        this.node.insertChild(child.node, this.node.getChildCount());
        this.children.push(child);
        child.parentElement = this;
        const root = this.getRoot();
        child.setRoot(root);
        child.afterAttached();
    }

    @Render()
    public insertBefore(child: DomElement, beforeChild: DomElement): void {
        if (this.childrenSet.has(child)) {
            this.removeChild(child);
        }

        this.childrenSet.add(child);

        const idx = this.children.findIndex((el) => el === beforeChild);
        if (idx === -1 || !this.childrenSet.has(beforeChild)) {
            throwError(
                this.getRoot(),
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

        if (idx === -1 || !this.childrenSet.has(child)) {
            throwError(
                this.getRoot(),
                "Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.",
            );
        }

        this.childrenSet.delete(child);

        child.beforeDetaching();

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
        this.parentElement?.removeChild(this);
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

    @RequestInput()
    public addEventListener(event: MouseEventType, handler: MouseEventHandler): void {
        this.eventListeners[event].add(handler);
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

    @RequestInput()
    public addKeyListener(action: Action): () => void {
        const origCb = action.callback;
        action.callback = () => {
            // When DOM layer focus is figured out
            // if (this.focus) {
            //     origCb?.();
            // }

            origCb?.();
        };

        this.metadata.actions.add(action);

        return () => {
            this.removeKeyListener(action);
        };
    }

    public removeKeyListener(action: Action): void {
        this.metadata.actions.delete(action);
    }

    // ========================================================================
    // Util
    // ========================================================================

    public getRoot(): Root | null {
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
