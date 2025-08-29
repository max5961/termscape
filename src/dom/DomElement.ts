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
    Point,
    StyleHandler,
    VisualNodeMap,
} from "../Types.js";
import type { Root } from "./Root.js";
import {
    DOM_ELEMENT_SCROLL_OFFSET,
    DOM_ELEMENT_RECT,
    DOM_ELEMENT_SHADOW_STYLE,
    ROOT_BRIDGE_DOM_ELEMENT,
    DOM_ELEMENT_CANVAS,
    DOM_ELEMENT_FOCUS_NODE,
} from "../Symbols.js";
import { Render, RequestInput } from "./util/decorators.js";
import { createVirtualStyleProxy } from "../style/StyleProxy.js";
import { objectKeys } from "../Util.js";
import { recalculateStyle } from "../style/util/recalculateStyle.js";
import { ElementMetaData } from "./ElementMetadata.js";
import { throwError } from "../shared/ThrowError.js";
import { Canvas } from "../compositor/Canvas.js";
import { Focus } from "./Context.js";

export abstract class DomElement<
    VStyle extends VirtualStyle = VirtualStyle,
    SStyle extends ShadowStyle = ShadowStyle,
> {
    public abstract tagName: TTagNames;
    public node: YogaNode;
    public parentElement: null | DomElement;
    public collection: DomElement[];

    protected readonly rootRef: { root: Root | null };
    protected rect: DOMRect;
    protected canvas: Canvas | null;
    protected scrollOffset: Point;
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
    protected styleHandler: StyleHandler<VStyle> | null;
    protected focusNode: Focus;

    constructor() {
        this.node = Yoga.Node.create();
        this.parentElement = null;
        this.collection = [];
        this.childrenSet = new Set();

        this.rootRef = { root: null };
        this.rect = this.initRect();
        this.canvas = null;
        this.scrollOffset = { x: 0, y: 0 };
        this.attributes = new Map();
        this.eventListeners = this.initEventListeners();
        this.requiresStdin = false;
        this.metadata = new ElementMetaData(this);

        const { virtualStyle, shadowStyle } = createVirtualStyleProxy<VStyle, SStyle>(
            this,
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

        this.styleHandler = null;
        this.focusNode = new Focus();
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

    get [DOM_ELEMENT_SCROLL_OFFSET]() {
        return this.scrollOffset;
    }

    get [DOM_ELEMENT_CANVAS]() {
        return this.canvas;
    }

    set [DOM_ELEMENT_CANVAS](canvas: Canvas | null) {
        this.canvas = canvas;
    }

    get [DOM_ELEMENT_FOCUS_NODE]() {
        return this.focusNode;
    }

    get children(): Readonly<DomElement[]> {
        return this.collection;
    }

    // ========================================================================
    // Auto Render Proxy
    // ========================================================================

    set style(stylesheet: VStyle | StyleHandler<VStyle>) {
        if (typeof stylesheet === "function") {
            this.styleHandler = stylesheet;
        } else {
            this.styleHandler = null;
        }

        let styles = stylesheet;
        if (this.styleHandler) {
            const { focus, shallowFocus } = this.focusNode.getStatus();
            styles = this.styleHandler({ focus, shallowFocus });
        }

        const withDefault = {
            ...this.baseDefaultStyles,
            ...this.defaultStyles,
            ...styles,
        } as VStyle;

        const keys = [...objectKeys(withDefault), ...objectKeys(this.style)];

        for (const key of keys) {
            this.style[key] = withDefault[key];
        }

        // Is this necessary?
        const root = this.getRoot();
        if (root) {
            root.scheduleRender();
        }
    }

    get style(): VStyle {
        return this.virtualStyle;
    }

    // ========================================================================
    // Tree Manipulation
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

    @Render({ layoutChange: true })
    public appendChild(child: DomElement): void {
        if (this.childrenSet.has(child)) return;
        this.childrenSet.add(child);
        this.focusNode.children.add(child.focusNode);

        this.node.insertChild(child.node, this.node.getChildCount());
        this.collection.push(child);
        child.parentElement = this;
        const root = this.getRoot();
        child.setRoot(root);
        child.afterAttached();
    }

    @Render({ layoutChange: true })
    public insertBefore(child: DomElement, beforeChild: DomElement): void {
        if (this.childrenSet.has(child)) {
            this.removeChild(child);
        }

        this.childrenSet.add(child);
        this.focusNode.children.add(child.focusNode);

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

        this.collection = nextChildren;
        this.node.insertChild(child.node, idx);
        child.parentElement = this;
        const root = this.getRoot();
        child.setRoot(root);

        child.afterAttached();
    }

    @Render({ layoutChange: true })
    public removeChild(child: DomElement, freeRecursive?: boolean) {
        const idx = this.children.findIndex((el) => el === child);

        if (idx === -1 || !this.childrenSet.has(child)) {
            throwError(
                this.getRoot(),
                "Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.",
            );
        }

        this.childrenSet.delete(child);
        this.focusNode.removeChild(child.focusNode);

        child.beforeDetaching();

        this.collection.splice(idx, 1);
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

    @Render({ layoutChange: true })
    protected removeParent() {
        this.parentElement?.removeChild(this);
    }

    // ========================================================================
    // Reconciler
    // ========================================================================

    @Render({ layoutChange: true })
    public hide(): void {
        this.node.setDisplay(Yoga.DISPLAY_NONE);
    }

    @Render({ layoutChange: true })
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

    // =========================================================================
    // Focus
    // =========================================================================

    public getFocus(): boolean {
        return this.focusNode.getStatus().focus;
    }

    public getShallowFocus(): boolean {
        return this.focusNode.getStatus().shallowFocus;
    }

    public focus() {
        if (this.focusNode.nearestCheckpoint) {
            this.focusNode.nearestCheckpoint.focused = true;
        }
    }

    protected becomeCheckpoint(focused: boolean) {
        this.focusNode.becomeCheckpoint(focused);
    }

    protected becomeNormal() {
        this.focusNode.becomeNormal();
    }

    protected toggleFocus(focused: boolean) {
        this.focusNode.updateCheckpoint(focused);
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

    public getUnclippedRect() {
        return this.canvas?.unclippedRect;
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
            if (this.getFocus()) {
                origCb?.();
            }
        };

        this.metadata.actions.add(action);

        return () => {
            this.removeKeyListener(action);
        };
    }

    public removeKeyListener(action: Action): void {
        this.metadata.actions.delete(action);
    }

    // =========================================================================
    // Scrolling
    // =========================================================================

    public scrollDown(units = 1) {
        this.applyScroll(0, -units);
    }

    public scrollUp(units = 1) {
        this.applyScroll(0, units);
    }

    public scrollLeft(units = 1) {
        this.applyScroll(units, 0);
    }

    public scrollRight(units = 1) {
        this.applyScroll(-units, 0);
    }

    protected applyScroll(dx: number, dy: number) {
        const allowedUnits = this.requestScroll(dx, dy);
        if (allowedUnits) {
            // scroll up/down
            if (dy) this.applyCornerOffset(0, allowedUnits);
            // scroll left/right
            if (dx) this.applyCornerOffset(allowedUnits, 0);
        }
    }

    protected requestScroll(dx: number, dy: number): number {
        if (!this.canvas) return 0;

        const contentRect = this.canvas.unclippedContentRect;
        const contentDepth = contentRect.corner.y + contentRect.height;
        const contentWidth = contentRect.corner.x + contentRect.width;

        if (dy) {
            const deepest = this.getDeepestContent(this, "y");

            // Negative y scrollOffset scrolls *down* by "pulling" content *up*
            if (dy < 0) {
                if (contentDepth >= deepest) return 0;
                return Math.max(dy, contentDepth - deepest);
            } else {
                // scrollOffset can only move in negative space, so its abs value
                // if the max allowed units before scrolling exceeds top
                return Math.min(dy, Math.abs(this.scrollOffset.y));
            }
        }

        if (dx) {
            const deepest = this.getDeepestContent(this, "x");

            // Scroll *left* attempt
            if (dx < 0) {
                if (contentWidth >= deepest) return 0;
                return Math.max(dx, contentWidth - deepest);
            } else {
                return Math.min(dx, Math.abs(this.scrollOffset.x));
            }
        }

        return 0;
    }

    protected getDeepestContent(elem: DomElement, axis: "x" | "y", level = 0) {
        const rect = elem.canvas?.unclippedRect;
        if (!rect) return 0;

        let deepest: number;
        if (axis === "x") {
            deepest = rect.corner.x + rect.width;
        } else {
            deepest = rect.corner.y + rect.height;
        }

        if (level === 0) deepest = -Infinity; // Don't calc `this`

        for (const child of elem.children) {
            deepest = Math.max(deepest, this.getDeepestContent(child, axis, level + 1));
        }

        return deepest;
    }

    @Render({ layoutChange: true })
    protected applyCornerOffset(dx: number, dy: number) {
        this.scrollOffset.x += dx;
        this.scrollOffset.y += dy;
    }

    // =========================================================================
    // Util
    // =========================================================================

    public getRoot(): Root | null {
        return this.rootRef.root;
    }

    protected setRoot(root: Root | null): void {
        this.rootRef.root = root;
    }

    protected dfs(elem: DomElement, cb: (elem: DomElement) => void) {
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

export abstract class FocusController<
    VStyle extends VirtualStyle,
    SStyle extends ShadowStyle,
> extends DomElement<VStyle, SStyle> {
    private vmap: VisualNodeMap;
    private _focused: DomElement | undefined;

    constructor() {
        super();
        this.vmap = new Map();
        this._focused = undefined;
    }

    protected abstract handleAppend(child: DomElement): void;
    protected abstract removeCheckpoint(child: DomElement): void;

    public override appendChild(child: DomElement): void {
        super.appendChild(child);
        this.handleAppend(child);
        recalculateStyle(child, "flexShrink");
    }

    public override insertBefore(child: DomElement, beforeChild: DomElement): void {
        super.insertBefore(child, beforeChild);
        this.handleAppend(child);
        recalculateStyle(child, "flexShrink");
    }

    public override removeChild(child: DomElement, freeRecursive?: boolean): void {
        super.removeChild(child, freeRecursive);
        this.handleRemove();
        recalculateStyle(child, "flexShrink");
    }

    public get focused() {
        return this._focused;
    }

    protected set focused(val: DomElement | undefined) {
        this._focused = val;
    }

    public get visualMap(): Readonly<VisualNodeMap> {
        return this.vmap;
    }

    private handleRemove() {
        const data = this.getCurrFocusedData();
        if (!data) return;

        const fd = this.style.flexDirection;
        if (fd === "row" || fd === "row-reverse") {
            this.focusChild(data.left || data.right || data.up || data.down);
        } else {
            this.focusChild(data.up || data.down || data.left || data.right);
        }
    }

    public focusChild(child: DomElement | undefined) {
        if (this.focused === child || !child) return;

        if (this.vmap.has(child)) {
            if (this.focused) {
                this.focused[DOM_ELEMENT_FOCUS_NODE].updateCheckpoint(false);
            }
            this.focused = child;
            this.focused[DOM_ELEMENT_FOCUS_NODE].updateCheckpoint(true);
        }
    }

    public mapChildrenToVMap(dir: "ltr" | "ttb" | "all" = "all") {
        const children = this.getNavigableChildren();
        this.vmap = new Map();

        if (dir === "ltr" || dir === "all") {
            const sortedX = children.slice().sort((prev, curr) => {
                const prevStart = prev.getUnclippedRect()?.corner.x ?? 0;
                const currStart = curr.getUnclippedRect()?.corner.x ?? 0;
                return prevStart - currStart;
            });
            for (let i = 0; i < sortedX.length; ++i) {
                const curr = sortedX[i];
                const prev = sortedX[i - 1] as DomElement | undefined;
                const next = sortedX[i + 1] as DomElement | undefined;

                if (!this.vmap.has(curr)) {
                    this.vmap.set(curr, {});
                }
                const data = this.vmap.get(curr)!;
                data.left = prev;
                data.right = next;
                data.xIdx = i;
                data.xArr = sortedX;
            }
        }
        if (dir === "ttb" || dir === "all") {
            const sortedY = children.slice().sort((prev, curr) => {
                const prevStart = prev.getUnclippedRect()?.corner.y ?? 0;
                const currStart = curr.getUnclippedRect()?.corner.y ?? 0;
                return prevStart - currStart;
            });
            for (let i = 0; i < sortedY.length; ++i) {
                const curr = sortedY[i];
                const prev = sortedY[i - 1] as DomElement | undefined;
                const next = sortedY[i + 1] as DomElement | undefined;

                if (!this.vmap.has(curr)) {
                    this.vmap.set(curr, {});
                }
                const data = this.vmap.get(curr)!;
                data.up = prev;
                data.down = next;
                data.yIdx = i;
                data.yArr = sortedY;
            }
        }
    }

    protected abstract getNavigableChildren(): DomElement[];

    private getCurrFocusedData() {
        if (!this.focused) return;
        return this.vmap.get(this.focused);
    }

    private getYArr() {
        return this.getCurrFocusedData()?.yArr;
    }

    private getXArr() {
        return this.getCurrFocusedData()?.xArr;
    }

    protected focusDown(): DomElement | undefined {
        const data = this.getCurrFocusedData();
        if (!data) return;
        if (data.down) {
            this.focusChild(data.down);
            return data.down;
        }
    }

    protected focusUp(): DomElement | undefined {
        const data = this.getCurrFocusedData();
        if (!data) return;
        if (data.up) {
            this.focusChild(data.up);
            return data.up;
        }
    }

    protected focusLeft(): DomElement | undefined {
        const data = this.getCurrFocusedData();
        if (!data) return;
        if (data.left) {
            this.focusChild(data.left);
            return data.left;
        }
    }

    protected focusRight(): DomElement | undefined {
        const data = this.getCurrFocusedData();
        if (!data) return;
        if (data.right) {
            this.focusChild(data.right);
            return data.right;
        }
    }

    protected focusXIdx(idx: number): DomElement | undefined {
        const xArr = this.getXArr();
        if (!xArr) return;
        if (xArr[idx]) {
            this.focusChild(xArr[idx]);
            return xArr[idx];
        }
    }

    protected focusYIdx(idx: number): DomElement | undefined {
        const yArr = this.getYArr();
        if (!yArr) return;
        if (yArr[idx]) {
            this.focusChild(yArr[idx]);
            return yArr[idx];
        }
    }

    protected focusFirstX(): DomElement | undefined {
        const xArr = this.getXArr();
        if (!xArr) return;
        if (xArr[0]) {
            this.focusChild(xArr[0]);
            return xArr[0];
        }
    }

    protected focusFirstY(): DomElement | undefined {
        const yArr = this.getYArr();
        if (!yArr) return;
        if (yArr[0]) {
            this.focusChild(yArr[0]);
            return yArr[0];
        }
    }

    protected focusLastX(): DomElement | undefined {
        const xArr = this.getXArr();
        if (!xArr) return;
        if (xArr.length) {
            this.focusChild(xArr[xArr.length - 1]);
            return xArr[xArr.length - 1];
        }
    }

    protected focusLastY(): DomElement | undefined {
        const yArr = this.getYArr();
        if (!yArr) return;
        if (yArr.length) {
            this.focusChild(yArr[yArr.length - 1]);
            return yArr[yArr.length - 1];
        }
    }

    protected focusDisplacement(dx: number, dy: number): DomElement | undefined {
        const data = this.getCurrFocusedData();
        if (!data) return;

        if (dx) {
            const xArr = data.xArr;
            const xIdx = data.xIdx;
            if (!xArr || xIdx === undefined) return;

            let nextIdx: number;
            if (dx < 0) {
                nextIdx = Math.max(0, xIdx + dx);
            } else {
                nextIdx = Math.min(xArr.length - 1, xIdx + dx);
            }

            this.focusChild(xArr[nextIdx]);
            return xArr[nextIdx];
        } else if (dy) {
            const yArr = data.yArr;
            const yIdx = data.yIdx;
            if (!yArr || yIdx === undefined) return;

            let nextIdx: number;
            if (dx < 0) {
                nextIdx = Math.max(0, yIdx + dy);
            } else {
                nextIdx = Math.min(yArr.length - 1, yIdx + dy);
            }

            this.focusChild(yArr[nextIdx]);
            return yArr[nextIdx];
        }
    }
}
