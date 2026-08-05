import { Yg } from "../Constants.js";
import type { Root } from "./RootElement.js";
import type { Action, KeyMap } from "term-keymap";
import type { DOMRect, YogaNode, StyleHandler, TagName } from "../Types.js";
import type { Style } from "./style/Style.js";
import type { Props } from "./props/Props.js";
import type { Canvas, Rect } from "../compositor/Canvas.js";
import {
    DOM_ELEMENT,
    TagNameIdentityMap,
    type ElementIdentityMap,
} from "../Constants.js";
import { Render, RequestInput } from "./util/decorators.js";
import { FocusNode } from "./shared/FocusNode.js";
import { throwError } from "../shared/ThrowError.js";
import { MetaData } from "./shared/MetaData.js";
import { DomEvents } from "./shared/DomEvents.js";
import type { Event, EventHandler } from "../Types.js";
import { ShadowStyleProxy } from "./style/ShadowStyleProxy.js";
import { VirtualStyleProxy } from "./style/VirtualStyleProxy.js";
import { PropsManager, type PropEffectHandler } from "./shared/PropsManager.js";
import { ScrollManager } from "./shared/ScrollManager.js";
import { ChildrenManager } from "./shared/ChildrenManager.js";

export abstract class DomElement<
    Schema extends {
        Style: Style.All;
        Props: Props.All;
    } = { Style: Style.All; Props: Props.All },
> {
    protected static readonly identity = DOM_ELEMENT;

    protected readonly _identities: Set<symbol>;
    public readonly _events: DomEvents;

    /** @internal */
    public readonly _metadata: MetaData;
    /** @internal */
    public readonly _node: YogaNode;
    /** @internal */
    public readonly _focusNode: FocusNode;
    /** @internal */
    public readonly _virtual!: VirtualStyleProxy;
    /** @internal */
    public readonly _shadow!: ShadowStyleProxy;
    /** @internal */
    public _canvas: Canvas | null;
    /** @internal */
    public _afterLayoutHandlers: Set<() => boolean>;
    /** @internal */
    public readonly _propsManager: PropsManager;
    /** @internal */
    public readonly _scrollManager: ScrollManager;
    /** @internal */
    public readonly _childrenManager: ChildrenManager;

    constructor(defaultStyles: Style.All) {
        this._identities = new Set();
        this.collectIdentities();

        this._node = Yg.Node.create();
        this._focusNode = new FocusNode(this);
        this._events = new DomEvents(this);
        this._metadata = new MetaData(this);
        this._propsManager = new PropsManager(this);
        this._scrollManager = new ScrollManager(this);
        this._afterLayoutHandlers = new Set();
        this._canvas = null;
        this._childrenManager = new ChildrenManager(this);
        this._afterLayoutHandlers = new Set();
        this._canvas = null;

        this._shadow = new ShadowStyleProxy(this);
        this._virtual = new VirtualStyleProxy(this, defaultStyles);

        this.registerPropEffect("scrollbar", this.registerScrollbarEffect);
        this.registerPropEffect("titleTopLeft", this.registerTitleEffect);
        this.registerPropEffect("titleTopCenter", this.registerTitleEffect);
        this.registerPropEffect("titleTopRight", this.registerTitleEffect);
        this.registerPropEffect("titleBottomLeft", this.registerTitleEffect);
        this.registerPropEffect("titleBottomCenter", this.registerTitleEffect);
        this.registerPropEffect("titleBottomRight", this.registerTitleEffect);
    }

    public abstract get tagName(): TagName;

    set style(stylesheet: Schema["Style"] | StyleHandler<Schema["Style"]>) {
        this._virtual._setStyle(stylesheet);
    }

    get style(): Schema["Style"] {
        return this._virtual as Schema["Style"];
    }

    // ***todo***
    // public getComputedStyle(style: keyof Schema["Style"]) {
    //     return this._shadow[style];
    // }

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

    public setProp<T extends keyof Schema["Props"]>(key: T, next: Schema["Props"][T]) {
        this._propsManager.setProp(key, next);
    }

    public getProp<T extends keyof Schema["Props"]>(
        key: T,
    ): Schema["Props"][T] | undefined {
        return this._propsManager.getProp(key);
    }

    /** @internal for better internal types */
    public _getAnyProp<T extends keyof Props.All>(key: T): Props.All[T] | undefined {
        return this._propsManager.getProp(key);
    }

    public registerPropEffect<T extends keyof Props.All>(
        prop: T,
        handler: PropEffectHandler<T>,
    ) {
        this._propsManager.registerEffect(prop, handler);
    }

    private registerScrollbarEffect = (
        ...[scrollbar, _prevScrollbar, setProp]: Parameters<
            PropEffectHandler<"scrollbar">
        >
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

        if (this._shadow.flexDirection?.includes("row")) {
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
        ...[title, _prevTitle, setProp]: Parameters<PropEffectHandler<"titleTopLeft">>
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

    public get parentElement() {
        return this._childrenManager.getParentElement();
    }

    public get children() {
        return this._childrenManager.getChildren();
    }

    public get firstElementChild() {
        return this._childrenManager.firstElementChild;
    }

    public get lastElementChild() {
        return this._childrenManager.lastElementChild;
    }

    @Render({ layoutChange: true })
    public appendChild(child: DomElement) {
        this._childrenManager.appendChild(child);
        child.afterAttached(this.getRoot());
    }

    @Render({ layoutChange: true })
    public insertBefore(child: DomElement, beforeChild: DomElement) {
        this._childrenManager.insertBefore(child, beforeChild);
        child.afterAttached(this.getRoot());
    }

    @Render({ layoutChange: true })
    public removeChild(child: DomElement, freeRecursive?: boolean) {
        child.beforeDetaching(this.getRoot());
        this._childrenManager.removeChild(child, freeRecursive);
    }

    @Render({ layoutChange: true })
    public hide(): void {
        this.style.display = "none";
    }

    @Render({ layoutChange: true })
    public unhide(): void {
        this.style.display = "flex";
    }

    // =========================================================================
    // Focus
    // =========================================================================

    // CHORE - How to handle this.  It needs to behave differently in FocusManager
    // @Render()
    // public focus() {
    //     this._focusNode.focusNearestProvider();
    // }

    public getFocus(): boolean {
        return this._focusNode._getCurrFocus();
    }

    public getShallowFocus(): boolean {
        return this._focusNode._getCurrShallowFocus();
    }

    public getFocusStatus() {
        return this._focusNode._getCurrStatus();
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

    public get hasComposedCanvas() {
        return !!this._canvas?.unclippedRect;
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

    // We don't necessarily want input this for non-mouse events, even though it would be rare to have an onFocus and not
    // be using some sort of input
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

    // FOCUS/BLUR
    /** @internal */
    public get hasFocusChangeHandler() {
        return (
            this._events.hasListeners("focus") ||
            this._events.hasListeners("blur") ||
            this._events.hasListeners("shallowfocus") ||
            this._events.hasListeners("shallowblur")
        );
    }

    public set onFocus(cb: EventHandler<"focus"> | undefined) {
        this.setSingle("focus", cb);
    }
    public set onShallowFocus(cb: EventHandler<"shallowfocus"> | undefined) {
        this.setSingle("shallowfocus", cb);
    }
    public set onBlur(cb: EventHandler<"blur"> | undefined) {
        this.setSingle("blur", cb);
    }
    public set onShallowBlur(cb: EventHandler<"shallowblur"> | undefined) {
        this.setSingle("shallowblur", cb);
    }
    public get onFocus() {
        return this._events.getSingle("focus");
    }
    public get onShallowFocus() {
        return this._events.getSingle("shallowfocus");
    }
    public get onBlur() {
        return this._events.getSingle("blur");
    }
    public get onShallowBlur() {
        return this._events.getSingle("shallowblur");
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

    /** @internal */
    public get _lastOffsetChangeWasFocus() {
        return this._scrollManager.lastOffsetChangeWasFocus;
    }

    public scrollDown(units = 1) {
        this._scrollManager.scrollDown(units);
    }

    public scrollUp(units = 1) {
        this._scrollManager.scrollUp(units);
    }

    public scrollLeft(units = 1) {
        this._scrollManager.scrollLeft(units);
    }

    public scrollRight(units = 1) {
        this._scrollManager.scrollRight(units);
    }

    public getScrollData() {
        return this._scrollManager.getScrollData();
    }

    // =========================================================================
    // Util
    // =========================================================================

    protected dfs(elem: DomElement, cb: (elem: DomElement) => void) {
        cb(elem);
        elem._childrenManager.children.forEach((child) => {
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
