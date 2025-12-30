import { Yg } from "../Constants.js";
import type { Root } from "./Root.js";
import type { Action } from "term-keymap";
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
import type { BaseProps, FocusManagerProps, Props } from "../Props.js";
import type { Canvas, Rect } from "../compositor/Canvas.js";
import {
    DOM_ELEMENT,
    FOCUS_MANAGER,
    TagNameIdentityMap,
    type ElementIdentityMap,
} from "../Constants.js";
import { Render, RequestInput } from "./util/decorators.js";
import { ElementMetaData } from "./ElementMetadata.js";
import { FocusNode } from "./FocusNode.js";
import { ErrorMessages } from "../shared/ErrorMessages.js";
import { createVirtualStyleProxy } from "../style/StyleProxy.js";
import { objectEntries, objectKeys } from "../Util.js";
import { throwError } from "../shared/ThrowError.js";
import { recalculateStyle } from "../style/util/recalculateStyle.js";
import { SideEffects, type PropEffectHandler } from "./SideEffects.js";

export abstract class DomElement<
    Schema extends {
        Style: BaseStyle;
        Props: BaseProps;
    } = { Style: BaseStyle; Props: BaseProps },
> {
    protected static readonly identity = DOM_ELEMENT;

    private static readonly DefaultStyles = {
        display: "flex",
        zIndex: "auto",
        overflow: "visible",
        flexDirection: "row",
        flexGrow: 0,
        flexShrink: 1,
    };

    public readonly node: YogaNode;
    public parentElement: null | DomElement;
    public contentRange: ReturnType<DomElement["initContentRange"]>;
    private identities: Set<symbol>;
    private effects: SideEffects;

    /**
     * @internal
     * Privately using the `children` getter conflicts with the `BookElement` implementation
     * */
    public _children: DomElement[];
    /** @internal */
    public virtualStyle!: Schema["Style"];
    /** @internal */
    public shadowStyle!: BaseShadowStyle;
    /** @internal */
    public scrollOffset: Point;
    /** @internal */
    public canvas: Canvas | null;
    /** @internal */
    public focusNode: FocusNode;
    /** @internal */
    public styleHandler: StyleHandler<Schema["Style"]> | null;
    /** @internal */
    public props: Map<string, unknown>;
    /** @internal */
    public afterLayoutHandlers: Set<() => unknown>;

    protected readonly childrenSet: Set<DomElement>;
    protected readonly rootRef: { root: Root | null };
    protected readonly metadata: ElementMetaData;
    protected readonly eventListeners: Map<MouseEventType, Set<MouseEventHandler>>;
    protected requiresStdin: boolean;
    protected lastOffsetChangeWasFocus: boolean;

    constructor() {
        this.identities = new Set();
        this.collectIdentities();
        this.node = Yg.Node.create();
        this.rootRef = { root: null };
        this.parentElement = null;
        this._children = [];
        this.props = new Map();
        this.eventListeners = new Map();
        this.metadata = new ElementMetaData(this);
        this.focusNode = new FocusNode(this);
        this.contentRange = this.initContentRange();
        this.scrollOffset = { x: 0, y: 0 };
        this.canvas = null;
        this.childrenSet = new Set();
        this.afterLayoutHandlers = new Set();
        this.effects = new SideEffects();

        // Mutable flags
        this.requiresStdin = false;
        this.lastOffsetChangeWasFocus = false;

        const proxy = createVirtualStyleProxy(this, this.rootRef, this.metadata);
        this.virtualStyle = proxy.virtualStyle;
        this.shadowStyle = proxy.shadowStyle;
        this.styleHandler = null;

        this.applyDefaultStyles();
        this.applyDefaultProps();

        this.regPropEffectTyped("scrollbar", this.registerScrollbarEffect);
        this.regPropEffectTyped("titleTopLeft", this.registerTitleEffect);
        this.regPropEffectTyped("titleTopCenter", this.registerTitleEffect);
        this.regPropEffectTyped("titleTopRight", this.registerTitleEffect);
        this.regPropEffectTyped("titleBottomLeft", this.registerTitleEffect);
        this.regPropEffectTyped("titleBottomCenter", this.registerTitleEffect);
        this.regPropEffectTyped("titleBottomRight", this.registerTitleEffect);
    }

    public abstract get tagName(): TagName;
    protected abstract get defaultProps(): Schema["Props"];
    protected abstract get defaultStyles(): Schema["Style"];

    private applyDefaultProps() {
        for (const [k, v] of objectEntries(this.defaultProps)) {
            this.setProp(k, v);
        }
    }

    private applyDefaultStyles() {
        this.style = {};
    }

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
            ...DomElement.DefaultStyles,
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

    private collectIdentities() {
        let ctor: any = this.constructor;

        while (ctor) {
            if (typeof ctor.identity === "symbol") {
                this.identities.add(ctor.identity);
            }
            ctor = Object.getPrototypeOf(ctor);
        }
    }

    /** @internal */
    public is<T extends keyof ElementIdentityMap>(sym: T): this is ElementIdentityMap[T] {
        return this.identities.has(sym);
    }

    public instanceOf<T extends keyof typeof TagNameIdentityMap>(
        tag: T,
    ): this is ElementIdentityMap[(typeof TagNameIdentityMap)[T]] {
        const identity = TagNameIdentityMap[tag];
        return this.identities.has(identity);
    }

    get children(): Readonly<DomElement[]> {
        return this._children;
    }

    public getProp<T extends keyof Schema["Props"]>(
        key: T,
    ): Schema["Props"][T] | undefined {
        return this.props.get(key as string) as Schema["Props"][T] | undefined;
    }

    /** @internal for better internal types */
    public getAnyProp<T extends keyof Props.All>(key: T): Props.All[T] | undefined {
        return this.props.get(key) as Props.All[T] | undefined;
    }

    @Render()
    public setProp<T extends keyof Schema["Props"]>(
        key: T,
        value: Schema["Props"][T],
    ): void {
        const setProp = (value: unknown) => {
            this.props.set(key as string, value);
        };

        setProp(value);
        this.effects.dispatchEffect(key as string, value, setProp);
    }

    protected registerPropEffect<T extends keyof Schema["Props"]>(
        prop: T,
        cb: PropEffectHandler<Schema["Props"][T]>,
    ) {
        this.effects.registerEffect(prop, cb as any);
    }

    private regPropEffectTyped<T extends keyof Props.All>(
        prop: T,
        cb: PropEffectHandler<Props.All[T]>,
    ) {
        this.effects.registerEffect(prop, cb as any);
    }

    private registerScrollbarEffect = (
        ...[scrollbar, setProp]: Parameters<PropEffectHandler<Props.All["scrollbar"]>>
    ) => {
        if (scrollbar === undefined) {
            this.style.scrollbarBorderTop = 0;
            this.style.scrollbarBorderBottom = 0;
            this.style.scrollbarBorderLeft = 0;
            this.style.scrollbarBorderRight = 0;
            this.style.scrollbarPaddingTop = 0;
            this.style.scrollbarPaddingBottom = 0;
            this.style.scrollbarPaddingLeft = 0;
            this.style.scrollbarPaddingRight = 0;
            return setProp(scrollbar);
        }

        if (this.shadowStyle.flexDirection?.includes("row")) {
            scrollbar.edge ??= "bottom";
        } else {
            scrollbar.edge ??= "right";
        }
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
        setProp(scrollbar);
    };

    private registerTitleEffect = (
        ...[title, setProp]: Parameters<PropEffectHandler<Props.All["titleTopLeft"]>>
    ) => {
        if (title === undefined) {
            return setProp(title);
        }

        title.style ??= "strikethrough";
        if (typeof title.style === "object") {
            title.style.left = title.style.left ?? "";
            title.style.right = title.style.right ?? "";
        }
        setProp(title);
    };

    /** @internal */
    public throwError(errorMsg: string) {
        return throwError(this.getRoot(), errorMsg);
    }

    /** @internal */
    public initContentRange() {
        return {
            high: Infinity,
            low: -Infinity,
            left: Infinity,
            right: -Infinity,
        };
    }

    /**
     * Schedules work to run after the next layout is finished calculating. This
     * is intended for cases where layout-dependent data is needed after an
     * expected state change. If your use case doesn't involve inspecting scroll
     * data or the rect of a node or its children, then it may be the wrong
     * function to use.
     *
     * This method supports two usage patterns:
     * 1) Single use
     * When called with no arguments (or a timeout value), a Promise is returned
     * that resolves after the next layout completes. An optional timeout value
     * resolves the Promise in case a render never occurs.  This is to prevent
     * rare cases where the app hangs up due to a render never occuring again.
     *
     * 2) Subscription
     * When called with a callback argument, the callback is executed after
     * every layout pass.
     *
     * @returns
     * - `Promise<void>` in 'single use' mode
     * - An unsubscribe function in 'subscription' mode.
     * */
    public afterLayout(timeoutFallback?: number): Promise<void>;
    public afterLayout(subscriber: () => unknown): () => void;
    public afterLayout(
        timeoutFallbackOrSubscriber?: number | (() => unknown),
    ): (() => void) | Promise<void> {
        if (typeof timeoutFallbackOrSubscriber === "function") {
            this.afterLayoutHandlers.add(timeoutFallbackOrSubscriber);
            return () => this.afterLayoutHandlers.delete(timeoutFallbackOrSubscriber);
        }

        return new Promise<void>((res) => {
            const removeSelf = () => {
                this.afterLayoutHandlers.delete(removeSelf);
                res();
            };

            this.afterLayoutHandlers.add(removeSelf);
            setTimeout(removeSelf, timeoutFallbackOrSubscriber ?? 500);
        });
    }

    // ========================================================================
    // Tree Manipulation
    // ========================================================================

    protected afterAttached(): void {
        const root = this.getRoot();
        if (!root) return;

        this.dfs(this, (elem) => {
            elem.setRoot(root);

            root.handleAttachmentChange(elem.metadata, { attached: true });

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
                root.handleAttachmentChange(elem.metadata, { attached: false });
            }
        });
    }

    @Render({ layoutChange: true })
    public appendChild(child: DomElement): void {
        if (this.childrenSet.has(child)) return;
        this.childrenSet.add(child);
        this.focusNode.children.add(child.focusNode);

        this.node.insertChild(child.node, this.node.getChildCount());
        this._children.push(child);
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
        for (let i = 0; i < this._children.length; ++i) {
            if (this._children[i] === beforeChild) {
                nextChildren.push(child);
                foundBeforeChild = true;
                childIdx = i;
            }
            nextChildren.push(this._children[i]);
        }

        if (!foundBeforeChild) {
            this.throwError(ErrorMessages.insertBefore);
        }

        this._children = nextChildren;
        this.node.insertChild(child.node, childIdx);
        child.parentElement = this;
        const root = this.getRoot();
        child.setRoot(root);

        child.afterAttached();
    }

    @Render({ layoutChange: true })
    public removeChild(child: DomElement, freeRecursive?: boolean) {
        const idx = this._children.findIndex((el) => el === child);

        if (idx === -1 || !this.childrenSet.has(child)) {
            this.throwError(ErrorMessages.removeChild);
        }

        this.childrenSet.delete(child);
        this.focusNode.removeChild(child.focusNode);

        child.beforeDetaching();

        this._children.splice(idx, 1);
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
        this.node.setDisplay(Yg.DISPLAY_NONE);
    }

    @Render({ layoutChange: true })
    public unhide(): void {
        this.node.setDisplay(Yg.DISPLAY_FLEX);
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

    public getBoundingClientRect(): DOMRect {
        const vis = this.visibleRect;
        return {
            x: vis.corner.x,
            y: vis.corner.y,
            top: vis.corner.y,
            left: vis.corner.x,
            right: vis.corner.x + vis.width,
            bottom: vis.corner.y + vis.height,
            height: vis.height,
            width: vis.width,
        };
    }

    public containsPoint(x: number, y: number): boolean {
        const visibleRect = this.visibleRect;

        if (x < visibleRect.corner.x) return false;
        if (y < visibleRect.corner.y) return false;
        if (x >= visibleRect.corner.x + visibleRect.width) return false;
        if (y >= visibleRect.corner.y + visibleRect.height) return false;
        return true;
    }

    // ========================================================================
    // Mouse Events
    // ========================================================================

    @RequestInput()
    public addEventListener(event: MouseEventType, handler: MouseEventHandler): void {
        if (!this.eventListeners.get(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event)!.add(handler);
    }

    public removeEventListener(event: MouseEventType, handler: MouseEventHandler): void {
        if (!this.eventListeners.get(event)) return;
        this.eventListeners.get(event)!.delete(handler);
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
            if (curr && curr.eventListeners.get(type)?.size) {
                const handlers = curr.eventListeners.get(type)!;

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
     * A negative dx scrolls *right* by "pulling" content *left*
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

            const contentExceedsWidth = mostRight - mostLeft > rect.corner.x + rect.width;
            const contentExceedsHeight = deepest - highest > rect.corner.y + rect.height;

            // TODO - Need to revisit this logic because it breaks under conditions
            // where there isn't enough content to scroll
            let dy = 0;
            let dx = 0;
            if (highest > highestRect) {
                dy = -1 * (highest - highestRect);
            }
            if (deepest < deepestRect && contentExceedsHeight) {
                dy = Math.max(0, deepestRect - deepest, highest - highestRect);
            }
            if (mostLeft > leftestRect) {
                dx = -1 * (mostLeft - leftestRect);
            }
            if (mostRight < rightestRect) {
                dx = mostRight - rightestRect;
            }

            // logger.write({ dx, dy });

            if (!dx && !dy) return false;

            this.applyCornerOffsetWithoutRender(dx, dy);
            return true;
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
        elem._children.forEach((child) => {
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
        Props: Props.FocusManager;
    } = { Style: BaseStyle; Props: FocusManagerProps },
> extends DomElement<Schema> {
    protected static override identity = FOCUS_MANAGER;

    private static RecalulateFlexShrink = (child: DomElement) => {
        recalculateStyle(child, "flexShrink");
    };

    private vmap: VisualNodeMap;
    private _focused: DomElement | undefined;

    constructor() {
        super();
        this.vmap = new Map();
        this._focused = undefined;
        this.lastOffsetChangeWasFocus = true;
    }

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
            this._children.forEach((child) => {
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
