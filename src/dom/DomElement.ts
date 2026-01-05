import { Yg } from "../Constants.js";
import type { Root } from "./RootElement.js";
import type { Action, KeyMap } from "term-keymap";
import type { DOMRect, YogaNode, Point, StyleHandler, TagName } from "../Types.js";
import type { Shadow, Style } from "./style/Style.js";
import type { Props } from "./props/Props.js";
import type { Canvas, Rect } from "../compositor/Canvas.js";
import {
    DOM_ELEMENT,
    TagNameIdentityMap,
    type ElementIdentityMap,
} from "../Constants.js";
import { Render, RequestInput } from "./util/decorators.js";
import { FocusNode } from "./shared/FocusNode.js";
import { ErrorMessages } from "../shared/ErrorMessages.js";
import { createVirtualStyleProxy } from "./style/StyleProxy.js";
import { objectEntries, objectKeys } from "../Util.js";
import { throwError } from "../shared/ThrowError.js";
import { SideEffects, type PropEffectHandler } from "./shared/SideEffects.js";
import { MetaData } from "./shared/MetaData.js";
import { DomEvents } from "./shared/DomEvents.js";
import type { Event, EventHandler } from "../Types.js";

export abstract class DomElement<
    Schema extends {
        Style: Style.All;
        Props: Props.All;
    } = { Style: Style.All; Props: Props.All },
> {
    protected static readonly identity = DOM_ELEMENT;

    private static DefaultStyle = {
        display: "flex",
        zIndex: "auto",
        overflow: "visible",
        flexDirection: "row",
        flexGrow: 0,
        flexShrink: 1,
    };

    protected readonly _identities: Set<symbol>;
    protected readonly _childSet: Set<DomElement>;
    protected readonly _effects: SideEffects;
    // protected readonly _eventListeners: Map<MouseEventType, Set<MouseEventHandler>>;
    public readonly _events: DomEvents;
    /** @internal */
    public _lastOffsetChangeWasFocus: boolean;

    /** @internal */
    public readonly _metadata: MetaData;
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
    public _afterLayoutHandlers: Set<() => boolean>;
    /** @internal */
    public _contentRange: ReturnType<DomElement["_initContentRange"]>;

    public parentElement: null | DomElement;

    constructor() {
        this._identities = new Set();
        this.collectIdentities();

        this._node = Yg.Node.create();
        this._children = [];
        this._scrollOffset = { x: 0, y: 0 };
        this._focusNode = new FocusNode(this);
        this._events = new DomEvents(this);
        this._metadata = new MetaData(this);
        this._effects = new SideEffects();
        this._childSet = new Set();
        this._props = new Map();
        this._afterLayoutHandlers = new Set();
        this._canvas = null;

        this._contentRange = this._initContentRange();
        this.parentElement = null;

        // Mutable flags
        this._lastOffsetChangeWasFocus = false;

        const proxy = createVirtualStyleProxy(this, this._metadata);
        this._virStyle = proxy.virtualStyle;
        this._shadowStyle = proxy.shadowStyle;
        this._styleHandler = null;

        this.applyDefaultStyles();
        this.applyDefaultProps();

        this.registerPropEffect("scrollbar", this.registerScrollbarEffect);
        this.registerPropEffect("titleTopLeft", this.registerTitleEffect);
        this.registerPropEffect("titleTopCenter", this.registerTitleEffect);
        this.registerPropEffect("titleTopRight", this.registerTitleEffect);
        this.registerPropEffect("titleBottomLeft", this.registerTitleEffect);
        this.registerPropEffect("titleBottomCenter", this.registerTitleEffect);
        this.registerPropEffect("titleBottomRight", this.registerTitleEffect);
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
            const { focus, shallowFocus } = this.getFocusState();
            styles = this._styleHandler({ focus, shallowFocus });
        }

        const withDefault = {
            ...DomElement.DefaultStyle,
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

    protected registerPropEffect<T extends keyof Props.All>(
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
     * The handler is ran after the post-compositor phase.  If it returns true, it
     * signals a possible change to the visual layout which triggers a fresh
     * recomposite without relying on the next render cycle.
     *
     * If subscribe is true, the handler will be queued to run in every
     * post-compositor phase until it is unsubscribed, which can be done with the
     * returned unsubscribe function.
     * */
    public afterLayout({
        subscribe,
        handler,
    }: {
        subscribe: boolean;
        handler: () => boolean;
    }): () => void {
        const wrapped = () => {
            if (!subscribe) {
                this._afterLayoutHandlers.delete(wrapped);
            }
            return handler();
        };
        this._afterLayoutHandlers.add(wrapped);
        return () => this._afterLayoutHandlers.delete(wrapped);
    }

    // ========================================================================
    // Tree Manipulation
    // ========================================================================

    protected getRoot() {
        return this._metadata.getRoot();
    }

    protected afterAttached(root: Root | undefined): void {
        if (!root) return;

        this.dfs(this, (elem) => {
            root.handleAttachment(elem._metadata);
        });
    }

    protected beforeDetaching(root: Root | undefined): void {
        if (!root) return;

        this.dfs(this, (elem) => {
            root.handleDetachment(elem._metadata);
        });
    }

    // CHORE - could rework the fn bodies of these tree manip methods

    @Render({ layoutChange: true })
    public appendChild(child: DomElement): void {
        if (this._childSet.has(child)) return;
        this._childSet.add(child);
        this._focusNode.appendChild(child._focusNode);

        this._node.insertChild(child._node, this._node.getChildCount());
        this._children.push(child);
        child.parentElement = this;

        child.afterAttached(this.getRoot());
    }

    @Render({ layoutChange: true })
    public insertBefore(child: DomElement, beforeChild: DomElement): void {
        if (this._childSet.has(child)) {
            this.removeChild(child);
        }

        this._childSet.add(child);
        this._focusNode.appendChild(child._focusNode);

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

        child.afterAttached(this.getRoot());
    }

    @Render({ layoutChange: true })
    public removeChild(child: DomElement, freeRecursive?: boolean) {
        const idx = this._children.findIndex((el) => el === child);

        if (idx === -1 || !this._childSet.has(child)) {
            this._throwError(ErrorMessages.removeChild);
        }

        this._childSet.delete(child);
        this._focusNode.removeChild(child._focusNode);

        child.beforeDetaching(this.getRoot());

        this._children.splice(idx, 1);
        this._node.removeChild(child._node);

        // If React removes a child, it should be gc'd.  If removing w/o React,
        // its possible that the child and its children may be used later, so
        // freeRecursive should be optional.
        if (freeRecursive) {
            child._node.freeRecursive();
        }

        child.parentElement = null;
    }

    @Render({ layoutChange: true })
    protected removeParent() {
        this.parentElement?.removeChild(this);
    }

    @Render({ layoutChange: true })
    public hide(): void {
        this._node.setDisplay(Yg.DISPLAY_NONE);
    }

    @Render({ layoutChange: true })
    public unhide(): void {
        this._node.setDisplay(Yg.DISPLAY_FLEX);
    }

    /** @internal */
    public _getYogaChildren(): YogaNode[] {
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

    // CHORE
    // Needs to be overridden in FocusManager to do this.focusChild(this)
    @Render()
    public focus() {
        this._focusNode.focusNearestProvider();
    }

    public getFocus(): boolean {
        return this._focusNode.getFocus();
    }

    public getShallowFocus(): boolean {
        return this._focusNode.getShallowFocus();
    }

    public getFocusState() {
        return this._focusNode.getFocusState();
    }

    // CHORE - Should these be _becomeFocusProvider for example since they are
    // public APIs for FocusNode?

    /** @internal */
    public _becomeProvider(focused: boolean) {
        this._focusNode.becomeProvider(focused);
    }

    /** @internal */
    public _becomeConsumer(freeRecursive?: boolean) {
        this._focusNode.becomeConsumer(freeRecursive);
    }

    /** @internal */
    public _setOwnProvider(focused: boolean) {
        this._focusNode.setOwnProvider(focused);
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
        return this._canvas?.visRect ?? this.getDefaultRect();
    }

    public get visibleContentRect(): Rect {
        return this._canvas?.visContentRect ?? this.getDefaultRect();
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
    public addEventListener<T extends Event>(event: T, handler: EventHandler<T>) {
        return this._events.addListener(event, handler);
    }

    public removeEventListener<T extends Event>(
        event: T,
        handler: EventHandler<T>,
    ): void {
        this._events.removeListener(event, handler);
    }

    @RequestInput()
    private setSingle(...args: Parameters<DomEvents["setSingle"]>) {
        return this._events.setSingle(...args);
    }

    // LEFT BTN
    public set onClick(cb: EventHandler<"click"> | undefined) {
        this.setSingle("click", cb);
    }
    public set onDblClick(cb: EventHandler<"dblclick"> | undefined) {
        this.setSingle("dblclick", cb);
    }
    public set onMouseDown(cb: EventHandler<"mousedown"> | undefined) {
        this.setSingle("mousedown", cb);
    }
    public set onMouseUp(cb: EventHandler<"mouseup"> | undefined) {
        this.setSingle("mouseup", cb);
    }
    // RIGHT BTN
    public set onRightClick(cb: EventHandler<"rightclick"> | undefined) {
        this.setSingle("rightclick", cb);
    }
    public set onRightDblClick(cb: EventHandler<"rightdblclick"> | undefined) {
        this.setSingle("rightdblclick", cb);
    }
    public set onRightMouseDown(cb: EventHandler<"rightmousedown"> | undefined) {
        this.setSingle("rightmousedown", cb);
    }
    public set onRightMouseUp(cb: EventHandler<"rightmouseup"> | undefined) {
        this.setSingle("rightmouseup", cb);
    }
    // SCROLL WHEEL
    public set onScrollUp(cb: EventHandler<"scrollup"> | undefined) {
        this.setSingle("scrollup", cb);
    }
    public set onScrollDown(cb: EventHandler<"scrolldown"> | undefined) {
        this.setSingle("scrolldown", cb);
    }
    public set onScrollClick(cb: EventHandler<"scrollclick"> | undefined) {
        this.setSingle("scrollclick", cb);
    }
    public set onScrollBtnUp(cb: EventHandler<"scrollbtnup"> | undefined) {
        this.setSingle("scrollbtnup", cb);
    }
    public set onScrollBtnDown(cb: EventHandler<"scrollbtndown"> | undefined) {
        this.setSingle("scrollbtndown", cb);
    }
    public set onScrollDblClick(cb: EventHandler<"scrolldblclick"> | undefined) {
        this.setSingle("scrolldblclick", cb);
    }
    // MOUSE MOVEMENT
    public set onMouseMove(cb: EventHandler<"mousemove"> | undefined) {
        this.setSingle("mousemove", cb);
    }
    public set onDragEnd(cb: EventHandler<"dragend"> | undefined) {
        this.setSingle("dragend", cb);
    }
    public set onDragStart(cb: EventHandler<"dragstart"> | undefined) {
        this.setSingle("dragstart", cb);
    }

    // LEFT BTN
    public get onClick() {
        return this._events.getSingle("click");
    }
    public get onDblClick() {
        return this._events.getSingle("dblclick");
    }
    public get onMouseDown() {
        return this._events.getSingle("mousedown");
    }
    public get onMouseUp() {
        return this._events.getSingle("mouseup");
    }
    // RIGHT BTN
    public get onRightClick() {
        return this._events.getSingle("rightclick");
    }
    public get onRightDblClick() {
        return this._events.getSingle("rightdblclick");
    }
    public get onRightMouseDown() {
        return this._events.getSingle("rightmousedown");
    }
    public get onRightMouseUp() {
        return this._events.getSingle("rightmouseup");
    }
    // SCROLL WHEEL
    public get onScrollUp() {
        return this._events.getSingle("scrollup");
    }
    public get onScrollDown() {
        return this._events.getSingle("scrolldown");
    }
    public get onScrollClick() {
        return this._events.getSingle("scrollclick");
    }
    public get onScrollBtnUp() {
        return this._events.getSingle("scrollbtnup");
    }
    public get onScrollBtnDown() {
        return this._events.getSingle("scrollbtndown");
    }
    public get onScrollDblClick() {
        return this._events.getSingle("scrolldblclick");
    }
    // MOUSE MOVEMENT
    public get onMouseMove() {
        return this._events.getSingle("mousemove");
    }
    public get onDragEnd() {
        return this._events.getSingle("dragend");
    }
    public get onDragStart() {
        return this._events.getSingle("dragstart");
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

        return this._metadata.addAction(action);
    }

    public removeKeyListener(action: Action): void {
        this._metadata.removeAction(action);
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

    // CHORE - should this code be in FocusManager, or streamlined in some other way

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

    // CHORE - triggerRender is difficult to follow/poorly named, but its for applying offsets
    // during compositing I'm pretty sure.

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

    // CHORE (possibly) - is it possible to make it so that we only need to remember
    // that negative offsets scroll up/left only here?

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

    // CHORE - this goes along with the triggerRender optional param.  This is poorly named

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

    // CHORE - this may be repeating logic but probably not

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
