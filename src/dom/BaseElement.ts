import Yoga from "yoga-wasm-web/auto";
import { DOMRect, RuntimeConfig, Style, TTagNames, YogaNode } from "../types.js";
import { type MouseEventHandler, type MouseEventType } from "../stdin/types.js";
import { Scheduler } from "./Scheduler.js";
import { Renderer } from "../render/Renderer.js";
import { RenderHooksManager } from "../render/RenderHooks.js";
import { Stdin } from "../stdin/Stdin.js";
import { Action } from "term-keymap";
import { Runtime } from "./Runtime.js";

export type FriendDomElement = { [P in keyof DomElement]: DomElement[P] };

export abstract class DomElement {
    public abstract tagName: TTagNames;
    public node: YogaNode;
    public parentElement: null | DomElement;
    public style: Style;
    public focus: boolean;

    protected root: DomElement | Root;
    protected children: DomElement[];
    protected rect: DOMRect;
    protected attributes: Map<string, unknown>;
    protected eventListeners: Record<MouseEventType, Set<MouseEventHandler>>;
    protected actions: Set<Action>;
    protected hasReqInputStream: boolean;

    constructor() {
        this.node = Yoga.Node.create();
        this.parentElement = null;
        this.style = {};
        this.focus = false;

        this.root = this;
        this.children = [];
        this.rect = this.initRect();
        this.attributes = new Map();
        this.eventListeners = this.initEventListeners();
        this.actions = new Set();
        this.hasReqInputStream = false;

        this.proxyTreeManipulationMethods();
        this.proxyStyleObject();
    }

    // ========================================================================
    // TREE MANIPULATION METHODS
    // ========================================================================

    public appendChild(child: DomElement): void {
        this.node.insertChild(child.node, this.node.getChildCount());
        this.children.push(child);
        child.parentElement = this;
        child.root = this;

        child.afterAttach();
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
        child.root = this.root;

        child.afterAttach();
    }

    public removeChild(child: DomElement) {
        child.beforeDetach();

        const idx = this.children.findIndex((el) => el === child);
        this.children.splice(idx, 1);
        this.node.removeChild(child.node);
        child.node.freeRecursive();
        child.parentElement = null;
        child.root = child;
    }

    public removeParent() {
        this.parentElement?.removeChild(this as unknown as DomElement);
    }

    // ========================================================================
    // Reconciler                                                           //
    // ========================================================================

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
        this.eventListeners[event].add(handler);
        this.hasReqInputStream = true;
    }

    public removeEventListener(event: MouseEventType, handler: MouseEventHandler): void {
        this.eventListeners[event].delete(handler);
    }

    // ========================================================================
    // Keymap Events
    // ========================================================================

    public addKeyListener(action: Action): () => void {
        this.hasReqInputStream = true;

        const origCb = action.callback;
        action.callback = () => {
            if (this.focus) {
                origCb?.();
            }
        };

        this.actions.add(action);
        const root = this.getRealRoot();
        root?.addKeyListener(action); // Root overrides `addKeyListener`
        return () => {
            this.removeKeyListener(action);
            this.getRealRoot()?.removeKeyListener(action);
        };
    }

    public removeKeyListener(action: Action): void {
        this.actions.delete(action);
        const root = this.getRealRoot();
        root?.removeKeyListener(action);
    }

    protected afterAttach(): void {
        const root = this.getRealRoot();
        if (!root) return;

        this.dfs(this, (elem) => {
            if (elem.hasReqInputStream) {
                root.connectToInput();
            }

            elem.actions.forEach((action) => {
                root.addKeyListener(action);
            });
        });
    }

    protected beforeDetach(): void {
        const root = this.getRealRoot();
        if (!root) return;

        this.dfs(this, (elem) => {
            elem.actions.forEach((action) => {
                root.removeKeyListener(action);
            });
        });
    }

    // ========================================================================
    // Auto Render Proxy
    // ========================================================================

    /** Requests a render on any modification of the style object (if attached to a Root) */
    protected abstract proxyStyleObject(): void;

    /** Requests a render on any tree manipulation method call (if attached to a Root) */
    private proxyTreeManipulationMethods(): void {
        const methods: (keyof DomElement)[] = [
            "appendChild",
            "insertBefore",
            "removeParent",
            "removeChild",
            "hide",
            "unhide",
        ] as const;

        for (const method of methods) {
            const original = this[method] as (...args: any[]) => any;

            if (typeof original === "function") {
                (this[method] as (...args: any[]) => any) = (...args) => {
                    original(...args);
                    this.getRealRoot()?.scheduleRender({ resize: false });
                };
            }
        }
    }

    // ========================================================================
    // Util
    // ========================================================================

    protected getRealRoot(): Root | undefined {
        return this.root instanceof Root ? this.root : undefined;
    }

    private dfs(elem: DomElement, cb: (elem: DomElement) => void) {
        cb(elem);
        elem.children.forEach((child) => {
            this.dfs(child, cb);
        });
    }
}

export class Root extends DomElement {
    public tagName: TTagNames;
    public hooks: RenderHooksManager;
    public runtime: Runtime;

    private stdin: Stdin;
    private scheduler: Scheduler;
    private renderer: Renderer;

    constructor(config: RuntimeConfig) {
        super();
        this.tagName = "ROOT_ELEMENT";
        this.node.setFlexWrap(Yoga.WRAP_NO_WRAP);
        this.node.setFlexDirection(Yoga.FLEX_DIRECTION_ROW);
        this.node.setFlexGrow(0);
        this.node.setFlexShrink(1);

        this.renderer = new Renderer(this);
        this.stdin = new Stdin(this);
        this.hooks = new RenderHooksManager(this.renderer.hooks);
        this.scheduler = new Scheduler();
        this.runtime = new Runtime(this, this.scheduler, this.stdin);

        this.configureRuntime(config);
    }

    // Noop implementation in Root
    protected proxyStyleObject(): void {}

    public configureRuntime(config: RuntimeConfig) {
        Object.entries(config).forEach(([key, val]) => {
            if (val !== undefined && key in this.runtime) {
                (this.runtime as any)[key] = val;
            }
        });
    }

    public addKeyListener(action: Action): () => void {
        this.stdin.subscribe(action);
        return () => {
            this.stdin.remove(action);
        };
    }

    public connectToInput() {
        this.stdin.listen();
    }

    public removeKeyListener(action: Action): void {
        this.stdin.remove(action);
    }

    public render(opts: { screenChange: boolean }) {
        //
    }

    public scheduleRender(opts: { resize: boolean }) {
        //
    }

    private beginRuntime() {
        //
    }
}
