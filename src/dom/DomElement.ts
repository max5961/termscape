import Yoga from "yoga-wasm-web/auto";
import { type Action } from "term-keymap";
import type {
    MouseEvent,
    MouseEventType,
    MouseEventHandler,
    DOMRect,
    YogaNode,
    Point,
    StyleHandler,
    VisualNodeMap,
    TagName,
} from "../Types.js";
import type { BaseStyle, BaseShadowStyle } from "../style/Style.js";
import type { BaseProps, FocusManagerProps, Scrollbar, Title } from "../Props.js";
import type { Root } from "./Root.js";
import { Render, RequestInput } from "./util/decorators.js";
import { createVirtualStyleProxy } from "../style/StyleProxy.js";
import { objectEntries, objectKeys } from "../Util.js";
import { ElementMetaData } from "./ElementMetadata.js";
import { Canvas, type Rect } from "../compositor/Canvas.js";
import { Focus } from "./FocusContext.js";
import { throwError } from "../shared/ThrowError.js";
import { ErrorMessages } from "../shared/ErrorMessages.js";
import { recalculateStyle } from "../style/util/recalculateStyle.js";

export abstract class DomElement<
    Schema extends {
        Style: BaseStyle;
        Props: BaseProps;
    } = { Style: BaseStyle; Props: BaseProps },
> {
    public node: YogaNode;
    public parentElement: null | DomElement;
    public contentRange: ReturnType<DomElement["initContentRange"]>;

    /** @internal */
    public rect: DOMRect;
    /** @internal */
    public virtualStyle!: Schema["Style"];
    /** @internal */
    public shadowStyle!: BaseShadowStyle;
    /** @internal */
    public scrollOffset: Point;
    /** @internal */
    public canvas: Canvas | null;
    /** @internal */
    public __children__: DomElement[];
    /** @internal */
    public focusNode: Focus;
    /** @internal */
    public styleHandler: StyleHandler<Schema["Style"]> | null;
    /** @internal */
    public postLayoutHooks: Set<() => unknown>;

    protected readonly rootRef: { root: Root | null };
    protected eventListeners: Record<MouseEventType, Set<MouseEventHandler>>;
    protected requiresStdin: boolean;
    protected props: Map<string, unknown>;
    protected removeKeyListeners: (() => void)[];
    protected childrenSet: Set<DomElement>;
    protected readonly metadata: ElementMetaData;
    protected readonly baseDefaultStyles: BaseStyle;
    protected lastOffsetChangeWasFocus: boolean;

    constructor() {
        this.node = Yoga.Node.create();
        this.parentElement = null;
        this.contentRange = this.initContentRange();

        /** Privately using the `children` getter conflicts with the `BookElement` implementation */
        this.__children__ = [];
        this.childrenSet = new Set();

        this.rootRef = { root: null };
        this.rect = this.initRect();
        this.canvas = null;
        this.scrollOffset = { x: 0, y: 0 };
        this.props = new Map();
        this.eventListeners = this.initEventListeners();
        this.requiresStdin = false;
        this.metadata = new ElementMetaData(this);
        this.lastOffsetChangeWasFocus = false;
        this.postLayoutHooks = new Set();

        const { virtualStyle, shadowStyle } = createVirtualStyleProxy<Schema["Style"]>(
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
        this.focusNode = new Focus(this);

        this.applyDefaultProps();
        this.applyDefaultStyles();
    }

    public abstract get tagName(): TagName;

    get children(): Readonly<DomElement[]> {
        return this.__children__;
    }

    @Render()
    public setProp<T extends keyof Schema["Props"]>(
        key: T,
        value: Schema["Props"][T],
    ): void {
        if ((key as keyof BaseProps) === "scrollbar" && value) {
            this.initializeScrollbar(value);
        } else if ((key as string).includes("title")) {
            this.initializeTitle(value as Title);
        }

        this.props.set(key as string, Object.freeze(value));
    }

    private initializeScrollbar(scrollbar: Scrollbar) {
        scrollbar.edge ??= "right";
        scrollbar.mode ??= "always";
        scrollbar.placement ??= "padding-outer";
        scrollbar.barChar = scrollbar.barChar ? scrollbar.barChar[0] : " ";
        scrollbar.trackChar = scrollbar.trackChar ? scrollbar.trackChar[0] : " ";

        if (scrollbar.placement === "border") {
            this.style.scrollbarBorderTop = scrollbar.edge === "top" ? 1 : 0;
            this.style.scrollbarBorderBottom = scrollbar.edge === "bottom" ? 1 : 0;
            this.style.scrollbarBorderLeft = scrollbar.edge === "left" ? 1 : 0;
            this.style.scrollbarBorderRight = scrollbar.edge === "right" ? 1 : 0;
        } else {
            this.style.scrollbarPaddingTop = scrollbar.edge === "top" ? 1 : 0;
            this.style.scrollbarPaddingBottom = scrollbar.edge === "bottom" ? 1 : 0;
            this.style.scrollbarPaddingLeft = scrollbar.edge === "left" ? 1 : 0;
            this.style.scrollbarPaddingRight = scrollbar.edge === "right" ? 1 : 0;
        }
    }

    private initializeTitle(title: Title) {
        title.style ??= "strikethrough";
        if (typeof title.style === "object") {
            title.style.left = title.style.left ?? "";
            title.style.right = title.style.right ?? "";
        }
    }

    /** @internal */
    public getBaseProp<T extends keyof BaseProps>(key: T): BaseProps[T] | undefined {
        return this.props.get(key) as BaseProps[T] | undefined;
    }

    public getProp<T extends keyof Schema["Props"]>(
        key: T,
    ): Schema["Props"][T] | undefined {
        return this.props.get(key as string) as Schema["Props"][T] | undefined;
    }

    private applyDefaultProps() {
        for (const [k, v] of objectEntries(this.defaultProps)) {
            this.setProp(k, v);
        }
    }

    private applyDefaultStyles() {
        this.style = { ...this.baseDefaultStyles, ...this.defaultStyles };
    }

    protected abstract get defaultProps(): Schema["Props"];
    protected abstract get defaultStyles(): Schema["Style"];

    protected throwError(errorMsg: string) {
        return throwError(this.getRoot(), errorMsg);
    }

    /**
     * @internal
     *
     * Returns the initial values for deepest child nodes content.  Used in constructor
     * and during compositing
     * */
    public initContentRange() {
        return {
            high: Infinity,
            low: -Infinity,
            left: Infinity,
            right: -Infinity,
        };
    }

    /**
     * Runs postlayout calculations
     * */
    public postLayoutHook(cb: () => unknown) {
        this.postLayoutHooks.add(cb);
        return () => this.postLayoutHooks.delete(cb);
    }

    // ========================================================================
    // Auto Render Proxy
    // ========================================================================

    set style(stylesheet: Schema["Style"] | StyleHandler<Schema["Style"]>) {
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
        } as Schema["Style"];

        const keys = [...objectKeys(withDefault), ...objectKeys(this.style)];

        for (const key of keys) {
            this.style[key] = withDefault[key];
        }
    }

    get style(): Schema["Style"] {
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

            root.bridgeDomElement(elem.metadata, { attached: true });

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
                root.bridgeDomElement(elem.metadata, { attached: false });
            }
        });
    }

    @Render({ layoutChange: true })
    public appendChild(child: DomElement): void {
        if (this.childrenSet.has(child)) return;
        this.childrenSet.add(child);
        this.focusNode.children.add(child.focusNode);

        this.node.insertChild(child.node, this.node.getChildCount());
        this.__children__.push(child);
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

        const nextChildren = [] as DomElement[];
        let foundBeforeChild = false;
        let childIdx = 0;
        for (let i = 0; i < this.__children__.length; ++i) {
            if (this.__children__[i] === beforeChild) {
                nextChildren.push(child);
                foundBeforeChild = true;
                childIdx = i;
            }
            nextChildren.push(this.__children__[i]);
        }

        if (!foundBeforeChild) {
            this.throwError(ErrorMessages.insertBefore);
        }

        this.__children__ = nextChildren;
        this.node.insertChild(child.node, childIdx);
        child.parentElement = this;
        const root = this.getRoot();
        child.setRoot(root);

        child.afterAttached();
    }

    @Render({ layoutChange: true })
    public removeChild(child: DomElement, freeRecursive?: boolean) {
        const idx = this.__children__.findIndex((el) => el === child);

        if (idx === -1 || !this.childrenSet.has(child)) {
            this.throwError(ErrorMessages.removeChild);
        }

        this.childrenSet.delete(child);
        this.focusNode.removeChild(child.focusNode);

        child.beforeDetaching();

        this.__children__.splice(idx, 1);
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

    private getDefaultRect(): Rect {
        return {
            corner: { x: 0, y: 0 },
            height: 0,
            width: 0,
        };
    }

    public get unclippedRect(): Rect {
        return this.canvas?.unclippedRect ?? this.getDefaultRect();
    }

    public get unclippedContentRect(): Rect {
        return this.canvas?.unclippedContentRect ?? this.getDefaultRect();
    }

    public get visibleRect(): Rect {
        return this.canvas?.visibleRect ?? this.getDefaultRect();
    }

    public get visibleContentRect(): Rect {
        return this.canvas?.visibleContentRect ?? this.getDefaultRect();
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
        this.lastOffsetChangeWasFocus = false;
        this.applyScroll(0, -units);
    }

    public scrollUp(units = 1) {
        this.lastOffsetChangeWasFocus = false;
        this.applyScroll(0, units);
    }

    public scrollLeft(units = 1) {
        this.lastOffsetChangeWasFocus = false;
        this.applyScroll(units, 0);
    }

    public scrollRight(units = 1) {
        this.lastOffsetChangeWasFocus = false;
        this.applyScroll(-units, 0);
    }

    /** @internal */
    public scrollDownWithFocus(units: number, triggerRender: boolean) {
        this.lastOffsetChangeWasFocus = true;
        this.applyScroll(0, -units, triggerRender);
    }

    /** @internal */
    public scrollUpWithFocus(units: number, triggerRender: boolean) {
        this.lastOffsetChangeWasFocus = true;
        this.applyScroll(0, units, triggerRender);
    }

    /** @internal */
    public scrollLeftWithFocus(units: number, triggerRender: boolean) {
        this.lastOffsetChangeWasFocus = true;
        this.applyScroll(units, 0, triggerRender);
    }

    /** @internal */
    public scrollRightWithFocus(units: number, triggerRender: boolean) {
        this.lastOffsetChangeWasFocus = true;
        this.applyScroll(-units, 0, triggerRender);
    }

    private applyScroll(dx: number, dy: number, triggerRender = true) {
        if (this.style.overflow !== "scroll") {
            this.throwError(ErrorMessages.invalidOverflowStyleForScroll);
        }

        const allowedUnits = this.requestScroll(dx, dy);

        if (allowedUnits) {
            // scroll up/down
            if (dy) {
                return triggerRender
                    ? this.applyCornerOffset(0, allowedUnits)
                    : this.applyCornerOffsetWithoutRender(0, allowedUnits);
            }
            // scroll left/right
            if (dx) {
                return triggerRender
                    ? this.applyCornerOffset(allowedUnits, 0)
                    : this.applyCornerOffsetWithoutRender(allowedUnits, 0);
            }
        }
    }

    /**
     * A negative dy scrolls *down* by "pulling" content *up*.
     * A negative dx scrolls *left* by "pulling" content *left*
     * */
    private requestScroll(dx: number, dy: number): number {
        if (!this.canvas) return 0;

        // Corner offsets **MUST** be whole numbers.  When drawing to the Canvas,
        // if the computed rects are floats, then nothing will be drawn since
        // you can't index a point on a grid with a float.
        dx = dx > 0 ? Math.floor(dx) : Math.ceil(dx);
        dy = dy > 0 ? Math.floor(dy) : Math.ceil(dy);

        const contentRect = this.canvas.unclippedContentRect;
        const contentDepth = contentRect.corner.y + contentRect.height;
        const contentWidth = contentRect.corner.x + contentRect.width;

        if (dy) {
            const lowest = this.contentRange.low;
            const highest = this.contentRange.high;

            // Pulling content up - scrolling down
            if (dy < 0) {
                if (contentDepth >= lowest) return 0;
                return Math.max(dy, contentDepth - lowest);

                // Pushing content down - scrolling up
            } else {
                if (contentRect.corner.y <= highest) return 0;
                return Math.min(dy, contentRect.corner.y - highest);
            }
        }

        if (dx) {
            const mostRight = this.contentRange.left;
            const mostLeft = this.contentRange.right;

            // Pulling content left - scrolling right
            if (dx < 0) {
                if (contentWidth >= mostRight) return 0;
                return Math.max(dx, contentWidth - mostRight);

                // Pushing content right - scrolling left
            } else {
                if (contentRect.corner.x <= mostLeft) return 0;
                return Math.min(dx, contentRect.corner.x - mostLeft);
            }
        }

        return 0;
    }

    @Render({ layoutChange: true })
    private applyCornerOffset(dx: number, dy: number) {
        this.applyCornerOffsetWithoutRender(dx, dy);
    }

    /**
     * @internal
     *
     * Applies the corner offset without triggering a render change.  This is
     * necessary during rendering and prevents the cascade of a new render.
     * */
    public applyCornerOffsetWithoutRender(dx: number, dy: number) {
        this.scrollOffset.x += dx;
        this.scrollOffset.y += dy;
    }

    /**
     * @internal
     *
     * After resizes, corner offset might be unoptimized.
     *
     * @returns `true` if any adjustments were made
     * */
    public adjustScrollToFillContainer(): boolean {
        const highest = this.contentRange.high;
        const deepest = this.contentRange.low;
        const mostLeft = this.contentRange.left;
        const mostRight = this.contentRange.right;

        const rect = this.unclippedContentRect;

        if (rect) {
            const deepestRect = rect.corner.y + rect.height;
            const highestRect = rect.corner.y;
            const leftestRect = rect.corner.x;
            const rightestRect = rect.corner.x + rect.width;

            if (
                (highestRect > highest && deepestRect > deepest) ||
                (deepestRect < deepest && highestRect < highest)
            ) {
                const displacement = this.requestScroll(0, Infinity);
                this.applyCornerOffsetWithoutRender(0, displacement);
                return true;
            }

            if (
                (leftestRect > mostLeft && mostRight > mostRight) ||
                (rightestRect < mostRight && leftestRect < mostLeft)
            ) {
                const displacement = this.requestScroll(0, -Infinity);
                this.applyCornerOffsetWithoutRender(0, displacement);
                return true;
            }
        }

        return false;
    }

    public getScrollData(): { x: number; y: number } {
        const rect = this.unclippedContentRect;
        const result = { x: 0, y: 0 };
        if (!rect) return result;

        const lowest = this.contentRange.low;
        const highest = this.contentRange.high;
        const currentY = rect.corner.y - highest;
        const possibleY = Math.abs(this.requestScroll(0, -Infinity));

        if (highest >= rect.corner.y) {
            result.y = 0;
        } else if (lowest <= rect.corner.y + rect.height) {
            result.y = 100;
        } else {
            result.y = Math.floor((currentY / (currentY + possibleY)) * 100);
        }

        const mostLeft = this.contentRange.left;
        const mostRight = this.contentRange.right;
        const currentX = rect.corner.x - mostLeft;
        const possibleX = Math.abs(this.requestScroll(-Infinity, 0));

        if (mostLeft >= rect.corner.x) {
            result.x = 0;
        } else if (mostRight <= rect.corner.x + rect.width) {
            result.x = 100;
        } else {
            result.x = Math.floor((currentX / (currentX + possibleX)) * 100);
        }

        return result;
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
        elem.__children__.forEach((child) => {
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

export abstract class FocusManager<
    Schema extends {
        Style: BaseStyle;
        Props: FocusManagerProps;
    },
> extends DomElement<Schema> {
    private vmap: VisualNodeMap;
    private _focused: DomElement | undefined;

    constructor() {
        super();
        this.vmap = new Map();
        this._focused = undefined;
        this.lastOffsetChangeWasFocus = true;
    }

    private static RecalulateFlexShrink = (child: DomElement) => {
        recalculateStyle(child, "flexShrink");
    };

    protected abstract getNavigableChildren(): DomElement[];
    protected abstract handleAppendChild(child: DomElement): void;
    // prettier-ignore
    protected abstract handleRemoveChild(child: DomElement, freeRecursive?: boolean): void;
    protected abstract buildVisualMap(children: DomElement[], vmap: VisualNodeMap): void;

    public override appendChild(child: DomElement): void {
        super.appendChild(child);
        this.handleAppendChild(child);

        FocusManager.RecalulateFlexShrink(child);
    }

    public override insertBefore(child: DomElement, beforeChild: DomElement): void {
        super.insertBefore(child, beforeChild);
        this.handleAppendChild(child);

        FocusManager.RecalulateFlexShrink(child);
    }

    public override removeChild(child: DomElement, freeRecursive?: boolean): void {
        this.handleRemoveChild(child, freeRecursive);
        super.removeChild(child, freeRecursive);

        if (this.focused === child) {
            const data = this.getFocusedData();
            const next = data?.up || data?.down || data?.left || data?.right;
            this.focusChild(next);
        }

        FocusManager.RecalulateFlexShrink(child);
    }

    /*
     * This needs to be overridden to ensure that `flexShrink` styles for children
     * are recalculated if `blockChildrenShrink` is set
     * */
    public override setProp<T extends keyof Schema["Props"]>(
        key: T,
        value: Schema["Props"][T],
    ): void {
        super.setProp(key, value);

        // If `blockChildrenShrink` is true, style handlers will set `flexShrink`
        // to `0`
        if (key === "blockChildrenShrink") {
            this.__children__.forEach((child) => {
                recalculateStyle(child, "flexShrink");
            });
        }
    }

    public get focused() {
        return this._focused;
    }

    protected set focused(val: DomElement | undefined) {
        this._focused = val;
    }

    protected get visualMap(): Readonly<VisualNodeMap> {
        return this.vmap;
    }

    private getFMProp<T extends keyof FocusManagerProps>(prop: T): FocusManagerProps[T] {
        return this.getProp(prop);
    }

    public focusChild(child: DomElement | undefined): DomElement | undefined {
        if (!child || this.focused === child) return;
        if (!this.vmap.has(child)) return;

        const prev = this.focused ? this.vmap.get(this.focused) : undefined;
        const next = this.vmap.get(child);

        this.focused?.focusNode.updateCheckpoint(false);
        this.focused = child;
        this.focused.focusNode.updateCheckpoint(true);

        const prevX = prev?.xIdx ?? 0;
        const prevY = prev?.yIdx ?? 0;
        const nextX = next?.xIdx ?? 0;
        const nextY = next?.yIdx ?? 0;
        const dx = nextX - prevX;
        const dy = nextY - prevY;

        this.normalizeScrollToFocus(
            dx < 0 ? "left" : dx > 0 ? "right" : dy < 0 ? "up" : "down",
        );

        return this.focused;
    }

    /**
     * @internal
     *
     * Handle layout changes or first renders that have pushed the focused item
     * out of visibility, and subsequently adjust the corner offset **without**
     * causing a re-render since this will be handled during compositing.
     *
     * @returns `true` if the corner offset was adjusted
     * */
    public adjustOffsetToFocus(): boolean {
        // Allow for non-focus scrolling to occur and obscure the focused child
        if (!this.lastOffsetChangeWasFocus) return false;

        // If undefined, this means that no layout has been generated yet
        const visibility = this.focusedChildVisibilityStatus();
        if (!visibility) return false;

        const { itemBelowWin, itemAboveWin, itemRightWin, itemLeftWin } = visibility;

        // Focused item is visible - no need to adjust corner offset
        if (!itemBelowWin && !itemAboveWin && !itemRightWin && !itemLeftWin) {
            return false;
        }

        if (itemBelowWin || itemAboveWin) {
            this.normalizeScrollToFocus("up", false);
        }
        if (itemRightWin || itemLeftWin) {
            this.normalizeScrollToFocus("left", false);
        }

        return true;
    }

    private focusedChildVisibilityStatus() {
        const fRect = this.focused?.unclippedRect;
        const wRect = this.unclippedContentRect;

        if (!fRect || !wRect) return;

        const wTop = wRect.corner.y;
        const fTop = fRect.corner.y;
        const wBot = wRect.corner.y + wRect.height;
        const fBot = fRect.corner.y + fRect.height;

        const fLeft = fRect.corner.x;
        const wLeft = wRect.corner.x;
        const fRight = fRect.corner.x + fRect.width;
        const wRight = wRect.corner.x + wRect.width;

        let scrollOff = this.getFMProp("keepFocusedCenter")
            ? Math.floor(wRect.height / 2)
            : Math.min(this.getFMProp("scrollOff") ?? 0, wBot);

        if (this.style.flexDirection?.includes("row")) {
            scrollOff = this.getFMProp("keepFocusedCenter")
                ? Math.floor(wRect.width / 2)
                : Math.min(this.getFMProp("scrollOff") ?? 0, wBot);
        }

        const itemBelowWin = fBot > wBot - scrollOff;
        const itemAboveWin = fTop <= wTop + scrollOff;

        const itemRightWin = fRight > wRight - scrollOff;
        const itemLeftWin = fLeft <= wLeft + scrollOff;

        return {
            itemBelowWin,
            itemAboveWin,
            itemRightWin,
            itemLeftWin,
        };
    }

    /**
     * @internal
     *
     * Adjust the `scrollOffset` in order to keep the focused element in view
     */
    public normalizeScrollToFocus(
        direction: "up" | "down" | "left" | "right",
        triggerRender = true,
    ) {
        if (!this.focused) return;
        if (!this.getFMProp("keepFocusedVisible")) return;

        const isScrollNegative = direction === "down" || direction === "left";
        const isLTR = direction === "left" || direction === "right";

        // Scroll Window Rect & Focus Item Rect
        const fRect = this.focused.unclippedRect;
        const wRect = this.canvas?.unclippedContentRect;
        if (!fRect || !wRect) return;

        if (!isLTR) {
            const wTop = wRect.corner.y;
            const fTop = fRect.corner.y;
            const wBot = wRect.corner.y + wRect.height;
            const fBot = fRect.corner.y + fRect.height;

            const scrollOff = this.getFMProp("keepFocusedCenter")
                ? Math.floor(wRect.height / 2)
                : Math.min(this.getFMProp("scrollOff") ?? 0, wBot);

            // If focus item is as large or larger than window, pin to top.
            if (fRect.height >= wRect.height) {
                const toScroll = fTop - wTop;
                if (toScroll > 0) {
                    this.scrollDownWithFocus(toScroll, triggerRender);
                } else {
                    this.scrollUpWithFocus(Math.abs(toScroll), triggerRender);
                }
                return;
            }

            const itemBelowWin = fBot > wBot - scrollOff;
            const itemAboveWin = fTop <= wTop + scrollOff;

            const scroll = () => {
                return isScrollNegative || this.getFMProp("keepFocusedCenter")
                    ? this.scrollDownWithFocus(fBot - wBot + scrollOff, triggerRender)
                    : this.scrollUpWithFocus(wTop + scrollOff - fTop, triggerRender);
            };

            if (itemBelowWin || itemAboveWin) {
                return scroll();
            }

            // `scroll` fn explanation
            // If `scrollOff` is greater than half the dimension of the window, then
            // the direction by which we are scrolling becomes important because the
            // scrollOff will cause the above/below variables to oscillate.  Checking
            // the direction forces the same behavior regardless.  In most other
            // cases the above/below variables align with `isScrollDown`.  If they
            // don't, such as when non-focus scroll is involved, either fn still
            // brings the focused item into the window.
        } else {
            const fLeft = fRect.corner.x;
            const wLeft = wRect.corner.x;
            const fRight = fRect.corner.x + fRect.width;
            const wRight = wRect.corner.x + wRect.width;

            if (fRect.width >= wRect.width) {
                const toScroll = fRight - wRight;
                if (toScroll > 0) {
                    this.scrollRightWithFocus(toScroll, triggerRender);
                } else {
                    this.scrollLeftWithFocus(Math.abs(toScroll), triggerRender);
                }
            }

            const scrollOff = this.getFMProp("keepFocusedCenter")
                ? Math.floor(wRect.width / 2)
                : Math.min(this.getFMProp("scrollOff") ?? 0, wRight);

            const itemRightWin = fRight > wRight - scrollOff;
            const itemLeftWin = fLeft <= wLeft + scrollOff;

            const scroll = () => {
                return isScrollNegative || this.getFMProp("keepFocusedCenter")
                    ? this.scrollRightWithFocus(
                          fRight - wRight + scrollOff,
                          triggerRender,
                      )
                    : this.scrollLeftWithFocus(wLeft + scrollOff - fLeft, triggerRender);
            };

            if (itemRightWin || itemLeftWin) {
                return scroll();
            }
        }
    }

    public refreshVisualMap() {
        const children = this.getNavigableChildren();
        this.vmap = new Map();
        this.buildVisualMap(children, this.vmap);
    }

    protected getFocusedData() {
        if (!this.focused) return;
        return this.vmap.get(this.focused);
    }

    private getYArr() {
        return this.getFocusedData()?.yArr;
    }

    private getXArr() {
        return this.getFocusedData()?.xArr;
    }

    private displaceFocus(dx: number, dy: number): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;
        if (!dx && !dy) return;

        const applyDisplacement = (d: number, idx?: number, arr?: DomElement[]) => {
            if (!arr || idx === undefined) return;

            let next = idx + d;

            if (this.getFMProp("fallthrough")) {
                if (next < 0) {
                    next = arr.length - 1;
                } else if (next > arr.length - 1) {
                    next = 0;
                }
            }

            if (d < 0) {
                next = Math.max(0, next);
            } else {
                next = Math.min(arr.length - 1, next);
            }

            this.focusChild(arr[next]);
            return arr[next];
        };

        const result = dx
            ? applyDisplacement(dx, data.xIdx, data.xArr)
            : applyDisplacement(dy, data.yIdx, data.yArr);

        return result;
    }

    protected focusDown(): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;
        if (data.down) {
            return this.focusChild(data.down);
        }
    }

    protected focusUp(): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;
        if (data.up) {
            return this.focusChild(data.up);
        }
    }

    protected focusLeft(): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;
        if (data.left) {
            return this.focusChild(data.left);
        }
    }

    protected focusRight(): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;
        if (data.right) {
            return this.focusChild(data.right);
        }
    }

    protected displaceDown(n = 1): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;

        return this.displaceFocus(0, Math.abs(n));
    }

    protected displaceUp(n = 1): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;

        return this.displaceFocus(0, -Math.abs(n));
    }

    protected displaceLeft(n = 1): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;

        return this.displaceFocus(-Math.abs(n), 0);
    }

    protected displaceRight(n = 1): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;

        return this.displaceFocus(Math.abs(n), 0);
    }

    protected focusXIdx(nextIdx: number): DomElement | undefined {
        const xArr = this.getXArr();
        if (!xArr || !xArr[nextIdx]) return;

        const prevIdx = this.getFocusedData()?.xIdx ?? 0;
        const displacement = nextIdx - prevIdx;

        return this.displaceFocus(displacement, 0);
    }

    protected focusYIdx(nextIdx: number): DomElement | undefined {
        const yArr = this.getYArr();
        if (!yArr || !yArr[nextIdx]) return;

        const prevIdx = this.getFocusedData()?.yIdx ?? 0;
        const displacement = nextIdx - prevIdx;

        return this.displaceFocus(0, displacement);
    }

    protected focusFirstX(): DomElement | undefined {
        const xArr = this.getXArr();
        if (!xArr || !xArr[0]) return;

        return this.focusChild(xArr[0]);
    }

    protected focusFirstY(): DomElement | undefined {
        const yArr = this.getYArr();
        if (!yArr || !yArr[0]) return;

        return this.focusChild(yArr[0]);
    }

    protected focusLastX(): DomElement | undefined {
        const xArr = this.getXArr();
        if (!xArr || !xArr.length) return;

        return this.focusChild(xArr[xArr.length - 1]);
    }

    protected focusLastY(): DomElement | undefined {
        const yArr = this.getYArr();
        if (!yArr || !yArr.length) return;

        return this.focusChild(yArr[yArr.length - 1]);
    }
}
