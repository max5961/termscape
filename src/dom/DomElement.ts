import { Yg } from "../Constants.js";
import type { Root } from "./RootElement.js";
import type { Action, KeyMap } from "term-keymap";
import type {
    MouseEvent,
    MouseEventType,
    MouseEventHandler,
    DOMRect,
    YogaNode,
    Point,
    StyleHandler,
    TagName,
} from "../Types.js";
import type { Shadow, Style } from "./style/Style.js";
import type { Props } from "./props/Props.js";
import type { Canvas, Rect } from "../compositor/Canvas.js";
import {
    DOM_ELEMENT,
    TagNameIdentityMap,
    type ElementIdentityMap,
} from "../Constants.js";
import { Render, RequestInput } from "./util/decorators.js";
import { ElementMetaData } from "./shared/ElementMetadata.js";
import { FocusNode } from "./shared/FocusNode.js";
import { ErrorMessages } from "../shared/ErrorMessages.js";
import { createVirtualStyleProxy } from "./style/StyleProxy.js";
import { objectEntries, objectKeys } from "../Util.js";
import { throwError } from "../shared/ThrowError.js";
import { SideEffects, type PropEffectHandler } from "./shared/SideEffects.js";
import { logger } from "../shared/Logger.js";

export abstract class DomElement<
    Schema extends {
        Style: Style.All;
        Props: Props.All;
    } = { Style: Style.All; Props: Props.All },
> {
    protected static readonly identity = DOM_ELEMENT;

    // Should come from DefaultStyles.ts
    private static readonly DefaultStyles = {
        display: "flex",
        zIndex: "auto",
        overflow: "visible",
        flexDirection: "row",
        flexGrow: 0,
        flexShrink: 1,
    };

    protected readonly _identities: Set<symbol>;
    protected readonly _childSet: Set<DomElement>;
    protected readonly _rootRef: { root: Root | null };
    protected readonly _effects: SideEffects;
    protected readonly _metadata: ElementMetaData;
    protected readonly _eventListeners: Map<MouseEventType, Set<MouseEventHandler>>;
    protected _requiresStdin: boolean;
    protected _lastOffsetChangeWasFocus: boolean;

    /** @internal */
    public readonly _node: YogaNode;
    /** @internal Privately using the `children` getter conflicts with the `BookElement` implementation */
    public _children: DomElement[];
    /** @internal */
    public readonly _focusNode: FocusNode;
    /** @internal */
    public readonly _props: Map<string, unknown>;
    /** @internal */
    public readonly _virStyle!: Schema["Style"];
    /** @internal */
    public readonly _shadowStyle!: Shadow<Style.All>;
    /** @internal */
    public readonly _scrollOffset: Point;
    /** @internal */
    public _canvas: Canvas | null;
    /** @internal */
    public _styleHandler: StyleHandler<Schema["Style"]> | null;
    /** @internal */
    public _afterLayoutHandlers: Set<() => unknown>;
    /** @internal*/
    public _forceRecompositeHandlers: Set<() => boolean>;
    /** @internal */
    public _contentRange: ReturnType<DomElement["_initContentRange"]>;

    public parentElement: null | DomElement;

    constructor() {
        this._identities = new Set();
        this.collectIdentities();

        this._node = Yg.Node.create();
        this._effects = new SideEffects();
        this._childSet = new Set();
        this._focusNode = new FocusNode(this);
        this._props = new Map();

        this._rootRef = { root: null };
        this._children = [];
        this._eventListeners = new Map();
        this._metadata = new ElementMetaData(this);
        this._scrollOffset = { x: 0, y: 0 };
        this._canvas = null;
        this._afterLayoutHandlers = new Set();
        this._forceRecompositeHandlers = new Set();

        this._contentRange = this._initContentRange();
        this.parentElement = null;

        // Mutable flags
        this._requiresStdin = false;
        this._lastOffsetChangeWasFocus = false;

        const proxy = createVirtualStyleProxy(this, this._rootRef, this._metadata);
        this._virStyle = proxy.virtualStyle;
        this._shadowStyle = proxy.shadowStyle;
        this._styleHandler = null;

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
            this._styleHandler = stylesheet;
        } else {
            this._styleHandler = null;
        }

        let styles = stylesheet;
        if (this._styleHandler) {
            const { focus, shallowFocus } = this._focusNode.getStatus();
            styles = this._styleHandler({ focus, shallowFocus });
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
        return this._virStyle;
    }

    private collectIdentities() {
        let ctor: any = this.constructor;

        while (ctor) {
            if (typeof ctor.identity === "symbol") {
                this._identities.add(ctor.identity);
            }
            ctor = Object.getPrototypeOf(ctor);
        }
    }

    /** @internal */
    public _is<T extends keyof ElementIdentityMap>(
        sym: T,
    ): this is ElementIdentityMap[T] {
        return this._identities.has(sym);
    }

    public instanceOf<T extends keyof typeof TagNameIdentityMap>(
        tag: T,
    ): this is ElementIdentityMap[(typeof TagNameIdentityMap)[T]] {
        const identity = TagNameIdentityMap[tag];
        return this._identities.has(identity);
    }

    get children(): Readonly<DomElement[]> {
        return this._children;
    }

    public getProp<T extends keyof Schema["Props"]>(
        key: T,
    ): Schema["Props"][T] | undefined {
        return this._props.get(key as string) as Schema["Props"][T] | undefined;
    }

    /** @internal for better internal types */
    public _getAnyProp<T extends keyof Props.All>(key: T): Props.All[T] | undefined {
        return this._props.get(key) as Props.All[T] | undefined;
    }

    @Render()
    public setProp<T extends keyof Schema["Props"]>(
        key: T,
        value: Schema["Props"][T],
    ): void {
        const setProp = (value: unknown) => {
            this._props.set(key as string, value);
        };

        setProp(value);
        this._effects.dispatchEffect(key as string, value, setProp);
    }

    protected registerPropEffect<T extends keyof Schema["Props"]>(
        prop: T,
        cb: PropEffectHandler<Schema["Props"][T]>,
    ) {
        this._effects.registerEffect(prop, cb as any);
    }

    private regPropEffectTyped<T extends keyof Props.All>(
        prop: T,
        cb: PropEffectHandler<Props.All[T]>,
    ) {
        this._effects.registerEffect(prop, cb as any);
    }

    private registerScrollbarEffect = (
        ...[scrollbar, setProp]: Parameters<PropEffectHandler<Props.All["scrollbar"]>>
    ) => {
        if (scrollbar === undefined) {
            this.style._scrollbarBorderTop = 0;
            this.style._scrollbarBorderBottom = 0;
            this.style._scrollbarBorderLeft = 0;
            this.style._scrollbarBorderRight = 0;
            this.style._scrollbarPaddingTop = 0;
            this.style._scrollbarPaddingBottom = 0;
            this.style._scrollbarPaddingLeft = 0;
            this.style._scrollbarPaddingRight = 0;
            return setProp(scrollbar);
        }

        if (this._shadowStyle.flexDirection?.includes("row")) {
            scrollbar.edge ??= "bottom";
        } else {
            scrollbar.edge ??= "right";
        }
        scrollbar.mode ??= "always";
        scrollbar.placement ??= "padding-outer";
        scrollbar.barChar = scrollbar.barChar ? scrollbar.barChar[0] : " ";
        scrollbar.trackChar = scrollbar.trackChar ? scrollbar.trackChar[0] : " ";

        if (scrollbar.placement === "border") {
            this.style._scrollbarBorderTop = scrollbar.edge === "top" ? 1 : 0;
            this.style._scrollbarBorderBottom = scrollbar.edge === "bottom" ? 1 : 0;
            this.style._scrollbarBorderLeft = scrollbar.edge === "left" ? 1 : 0;
            this.style._scrollbarBorderRight = scrollbar.edge === "right" ? 1 : 0;
        } else {
            this.style._scrollbarPaddingTop = scrollbar.edge === "top" ? 1 : 0;
            this.style._scrollbarPaddingBottom = scrollbar.edge === "bottom" ? 1 : 0;
            this.style._scrollbarPaddingLeft = scrollbar.edge === "left" ? 1 : 0;
            this.style._scrollbarPaddingRight = scrollbar.edge === "right" ? 1 : 0;
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
    public _throwError(errorMsg: string) {
        return throwError(this.getRoot(), errorMsg);
    }

    /** @internal */
    public _initContentRange() {
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
            this._afterLayoutHandlers.add(timeoutFallbackOrSubscriber);
            return () => this._afterLayoutHandlers.delete(timeoutFallbackOrSubscriber);
        }

        return new Promise<void>((res) => {
            const removeSelf = () => {
                this._afterLayoutHandlers.delete(removeSelf);
                res();
            };

            this._afterLayoutHandlers.add(removeSelf);
            setTimeout(removeSelf, timeoutFallbackOrSubscriber ?? 500);
        });
    }

    /**
     * This runs once everything has composited, but before anything is rendered.
     * If returning true, then a recomposite will occur BEFORE writing output.
     *
     * In the current implementation this does NOT recalculate the yoga layout,
     * so maybe recomposeIfMutOffset should be a wider scope and just always
     * recalc the yoga layout...
     * */
    public forceRecomposite(cb: () => boolean) {
        const removeSelf = () => {
            this._forceRecompositeHandlers.delete(removeSelf);
            return cb();
        };

        this._forceRecompositeHandlers.add(removeSelf);
    }

    // ========================================================================
    // Tree Manipulation
    // ========================================================================

    protected afterAttached(): void {
        const root = this.getRoot();
        if (!root) return;

        this.dfs(this, (elem) => {
            elem.setRoot(root);

            root.handleAttachmentChange(elem._metadata, { attached: true });

            if (elem._requiresStdin) {
                root.requestInputStream();
            }
        });
    }

    protected beforeDetaching(): void {
        const root = this.getRoot();

        this.dfs(this, (elem) => {
            elem.setRoot(null);

            if (root) {
                root.handleAttachmentChange(elem._metadata, { attached: false });
            }
        });
    }

    @Render({ layoutChange: true })
    public appendChild(child: DomElement): void {
        if (this._childSet.has(child)) return;
        this._childSet.add(child);
        this._focusNode.children.add(child._focusNode);

        this._node.insertChild(child._node, this._node.getChildCount());
        this._children.push(child);
        child.parentElement = this;
        const root = this.getRoot();
        child.setRoot(root);
        child.afterAttached();
    }

    @Render({ layoutChange: true })
    public insertBefore(child: DomElement, beforeChild: DomElement): void {
        if (this._childSet.has(child)) {
            this.removeChild(child);
        }

        this._childSet.add(child);
        this._focusNode.children.add(child._focusNode);

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
            this._throwError(ErrorMessages.insertBefore);
        }

        this._children = nextChildren;
        this._node.insertChild(child._node, childIdx);
        child.parentElement = this;
        const root = this.getRoot();
        child.setRoot(root);

        child.afterAttached();
    }

    @Render({ layoutChange: true })
    public removeChild(child: DomElement, freeRecursive?: boolean) {
        const idx = this._children.findIndex((el) => el === child);

        if (idx === -1 || !this._childSet.has(child)) {
            this._throwError(ErrorMessages.removeChild);
        }

        this._childSet.delete(child);
        this._focusNode.removeChild(child._focusNode);

        child.beforeDetaching();

        this._children.splice(idx, 1);
        this._node.removeChild(child._node);

        // If React removes a child, it should be gc'd.  If removing w/o React,
        // its possible that the child and its children may be used later, so
        // freeRecursive should be optional.
        if (freeRecursive) {
            child._node.freeRecursive();
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
        this._node.setDisplay(Yg.DISPLAY_NONE);
    }

    @Render({ layoutChange: true })
    public unhide(): void {
        this._node.setDisplay(Yg.DISPLAY_FLEX);
    }

    public getYogaChildren(): YogaNode[] {
        const count = this._node.getChildCount();
        const yogaNodes = [] as YogaNode[];
        for (let i = 0; i < count; ++i) {
            yogaNodes.push(this._node.getChild(i));
        }
        return yogaNodes;
    }

    // =========================================================================
    // Focus
    // =========================================================================

    public getFocus(): boolean {
        return this._focusNode.getStatus().focus;
    }

    public getShallowFocus(): boolean {
        return this._focusNode.getStatus().shallowFocus;
    }

    public focus() {
        if (this._focusNode.nearestCheckpoint) {
            this._focusNode.nearestCheckpoint.focused = true;
        }
    }

    protected becomeCheckpoint(focused: boolean) {
        this._focusNode.becomeCheckpoint(focused);
    }

    protected becomeNormal() {
        this._focusNode.becomeNormal();
    }

    protected toggleFocus(focused: boolean) {
        this._focusNode.updateCheckpoint(focused);
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
        return this._canvas?.unclippedRect ?? this.getDefaultRect();
    }

    public get unclippedContentRect(): Rect {
        return this._canvas?.unclippedContentRect ?? this.getDefaultRect();
    }

    public get visibleRect(): Rect {
        return this._canvas?.visibleRect ?? this.getDefaultRect();
    }

    public get visibleContentRect(): Rect {
        return this._canvas?.visibleContentRect ?? this.getDefaultRect();
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
        if (!this._eventListeners.get(event)) {
            this._eventListeners.set(event, new Set());
        }
        this._eventListeners.get(event)!.add(handler);
    }

    public removeEventListener(event: MouseEventType, handler: MouseEventHandler): void {
        if (!this._eventListeners.get(event)) return;
        this._eventListeners.get(event)!.delete(handler);
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
            if (curr && curr._eventListeners.get(type)?.size) {
                const handlers = curr._eventListeners.get(type)!;

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

    public addKeyListener(keymap: Action["keymap"], cb: () => unknown): () => void;
    public addKeyListener(action: Action, cb?: undefined): () => void;
    public addKeyListener(
        actionOrKeymap: Action | Action["keymap"],
        cb?: () => unknown,
    ): () => void {
        return this.addKeyListenerHelper(actionOrKeymap, cb);
    }

    /** Cannot use a decorator on an overloaded function */
    @RequestInput()
    private addKeyListenerHelper(
        actionOrKeymap: Action | Action["keymap"],
        cb?: () => unknown,
    ): () => void {
        let action = actionOrKeymap as Action;

        if (typeof action !== "object" || !Object.hasOwn(action, "keymap")) {
            action = {
                keymap: action as KeyMap,
                callback: cb,
            };
        }

        this._metadata.actions.add(action);
        return () => this.removeKeyListener(action);
    }

    public removeKeyListener(action: Action): void {
        this._metadata.actions.delete(action);
    }

    // =========================================================================
    // Scrolling
    // =========================================================================

    public scrollDown(units = 1) {
        this._lastOffsetChangeWasFocus = false;
        this.applyScroll(0, -units);
    }

    public scrollUp(units = 1) {
        this._lastOffsetChangeWasFocus = false;
        this.applyScroll(0, units);
    }

    public scrollLeft(units = 1) {
        this._lastOffsetChangeWasFocus = false;
        this.applyScroll(units, 0);
    }

    public scrollRight(units = 1) {
        this._lastOffsetChangeWasFocus = false;
        this.applyScroll(-units, 0);
    }

    /** @internal */
    public _scrollDownWithFocus(units: number, triggerRender: boolean) {
        this._lastOffsetChangeWasFocus = true;
        this.applyScroll(0, -units, triggerRender);
    }

    /** @internal */
    public _scrollUpWithFocus(units: number, triggerRender: boolean) {
        this._lastOffsetChangeWasFocus = true;
        this.applyScroll(0, units, triggerRender);
    }

    /** @internal */
    public _scrollLeftWithFocus(units: number, triggerRender: boolean) {
        this._lastOffsetChangeWasFocus = true;
        this.applyScroll(units, 0, triggerRender);
    }

    /** @internal */
    public _scrollRightWithFocus(units: number, triggerRender: boolean) {
        this._lastOffsetChangeWasFocus = true;
        this.applyScroll(-units, 0, triggerRender);
    }

    private applyScroll(dx: number, dy: number, triggerRender = true) {
        if (this.style.overflow !== "scroll") {
            this._throwError(ErrorMessages.invalidOverflowStyleForScroll);
        }

        const allowedUnits = this.requestScroll(dx, dy);

        if (allowedUnits) {
            // scroll up/down
            if (dy) {
                return triggerRender
                    ? this.applyCornerOffset(0, allowedUnits)
                    : this._applyCornerOffsetWithoutRender(0, allowedUnits);
            }
            // scroll left/right
            if (dx) {
                return triggerRender
                    ? this.applyCornerOffset(allowedUnits, 0)
                    : this._applyCornerOffsetWithoutRender(allowedUnits, 0);
            }
        }
    }

    /**
     * A negative dy scrolls *down* by "pulling" content *up*.
     * A negative dx scrolls *right* by "pulling" content *left*
     * */
    private requestScroll(dx: number, dy: number): number {
        if (!this._canvas) return 0;

        // Corner offsets **MUST** be whole numbers.  When drawing to the Canvas,
        // if the computed rects are floats, then nothing will be drawn since
        // you can't index a point on a grid with a float.
        dx = dx > 0 ? Math.floor(dx) : Math.ceil(dx);
        dy = dy > 0 ? Math.floor(dy) : Math.ceil(dy);

        const contentRect = this._canvas.unclippedContentRect;
        const contentDepth = contentRect.corner.y + contentRect.height;
        const contentWidth = contentRect.corner.x + contentRect.width;

        if (dy) {
            const lowest = this._contentRange.low;
            const highest = this._contentRange.high;

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
            const mostRight = this._contentRange.right;
            const mostLeft = this._contentRange.left;

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
        this._applyCornerOffsetWithoutRender(dx, dy);
    }

    /**
     * @internal
     *
     * Applies the corner offset without triggering a render change.  This is
     * necessary during rendering itself and prevents the cascade of a new render.
     * */
    public _applyCornerOffsetWithoutRender(dx: number, dy: number) {
        this._scrollOffset.x += dx;
        this._scrollOffset.y += dy;
    }

    /**
     * @internal
     *
     * After resizes, corner offset might be unoptimized.
     *
     * @returns `true` if any adjustments were made
     * */
    public _adjustScrollToFillContainer(): boolean {
        const highest = this._contentRange.high;
        const lowest = this._contentRange.low;
        const leftest = this._contentRange.left;
        const rightest = this._contentRange.right;

        const rect = this.unclippedContentRect;

        if (rect) {
            const lowestVis = rect.corner.y + rect.height;
            const highestVis = rect.corner.y;
            const leftestVis = rect.corner.x;
            const rightestVis = rect.corner.x + rect.width;

            const fitsHeight = lowest - highest <= rect.height;
            const fitsWidth = rightest - leftest <= rect.width;

            let dy = 0;
            let dx = 0;

            if (!fitsHeight) {
                if (highest > highestVis) {
                    // need to scroll DOWN (-dy)
                    dy = highestVis - highest;
                } else if (lowest < lowestVis) {
                    // need to scroll UP (+dy)
                    dy = lowestVis - lowest;
                }
            }
            if (!fitsWidth) {
                if (leftest > leftestVis) {
                    dx = leftestVis - leftest;
                } else if (rightest < rightestVis) {
                    dx = rightestVis - rightest;
                }
            }

            if (!dx && !dy) return false;

            this._applyCornerOffsetWithoutRender(dx, dy);
            return true;
        }

        return false;
    }

    public getScrollData(): { x: number; y: number } {
        const rect = this.unclippedContentRect;
        const result = { x: 0, y: 0 };
        if (!rect) return result;

        const lowest = this._contentRange.low;
        const highest = this._contentRange.high;
        const currentY = rect.corner.y - highest;
        const possibleY = Math.abs(this.requestScroll(0, -Infinity));

        if (highest >= rect.corner.y) {
            result.y = 0;
        } else if (lowest <= rect.corner.y + rect.height) {
            result.y = 100;
        } else {
            result.y = Math.floor((currentY / (currentY + possibleY)) * 100);
        }

        const mostLeft = this._contentRange.left;
        const mostRight = this._contentRange.right;
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
        return this._rootRef.root;
    }

    protected setRoot(root: Root | null): void {
        this._rootRef.root = root;
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
