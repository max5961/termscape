import Yoga from "yoga-wasm-web/auto";
import { ConfigureStdin, DOMRect, Style, TTagNames, YogaNode } from "../types.js";
import { type MouseEventHandler, type MouseEventType } from "../stdin/types.js";
import { Scheduler } from "./Scheduler.js";
import { Renderer } from "../render/Renderer.js";
import { RenderHooksManager } from "../render/RenderHooks.js";
import { Stdin } from "../stdin/Stdin.js";
import { Ansi } from "../util/Ansi.js";
import { Action } from "term-keymap";

export type FriendBaseElement = {
    [P in keyof BaseElement]: BaseElement[P];
};

export abstract class BaseElement {
    public abstract tagName: TTagNames;
    public node: YogaNode;
    public parentElement: null | BaseElement;
    public style: Style;

    protected root: BaseElement | Root;
    protected children: BaseElement[];
    protected rect: DOMRect;
    protected attributes: Map<string, unknown>;
    protected eventListeners: Record<MouseEventType, Set<MouseEventHandler>>;

    constructor() {
        this.node = Yoga.Node.create();
        this.parentElement = null;
        this.style = {};

        this.root = this;
        this.children = [];
        this.rect = this.initRect();
        this.attributes = new Map();
        this.eventListeners = this.initEventListeners();

        this.proxyTreeManipulationMethods();
        this.proxyStyleObject();
    }

    ///////////////////////////////////////////////////////////////////////////
    //  TREE MANIPULATION METHODS                                            //
    ///////////////////////////////////////////////////////////////////////////

    public appendChild(child: BaseElement): void {
        this.node.insertChild(child.node, this.node.getChildCount());
        this.children.push(child);
        child.parentElement = this;
        child.root = this;
    }

    public insertBefore(child: BaseElement, beforeChild: BaseElement): void {
        const nextChildren = [] as BaseElement[];
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
    }

    public removeChild(child: BaseElement) {
        const idx = this.children.findIndex((el) => el === child);
        this.children.splice(idx, 1);
        this.node.removeChild(child.node);
        child.node.freeRecursive();
        child.parentElement = null;
        child.root = child;
    }

    public removeParent() {
        this.parentElement?.removeChild(this as unknown as BaseElement);
    }

    ///////////////////////////////////////////////////////////////////////////
    //  Reconciler                                                           //
    ///////////////////////////////////////////////////////////////////////////

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

    ///////////////////////////////////////////////////////////////////////////
    //  DOMRects                                                             //
    ///////////////////////////////////////////////////////////////////////////

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

    ///////////////////////////////////////////////////////////////////////////
    //  Mouse Events                                                         //
    ///////////////////////////////////////////////////////////////////////////

    private initEventListeners<
        T = BaseElement["eventListeners"][keyof BaseElement["eventListeners"]],
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
    }

    public removeEventListener(event: MouseEventType, handler: MouseEventHandler): void {
        this.eventListeners[event].delete(handler);
    }

    // BaseElement should have a protected Set of actions and when added to
    // a Root tree they should all subscribe.  If removed from the DomTree they
    // should stay in the Set, but be unsubscribed
    public addKeyListener(action: Action): void {
        //
    }

    public removeKeyListener(action: Action): void {
        //
    }

    protected isAttached() {
        return this.root instanceof Root;
    }

    ///////////////////////////////////////////////////////////////////////////
    //  Auto Render Proxy                                                    //
    ///////////////////////////////////////////////////////////////////////////

    /** Requests a render on any modification of the style object (if attached to a Root) */
    protected abstract proxyStyleObject(): void;

    /** Requests a render on any tree manipulation method call (if attached to a Root) */
    private proxyTreeManipulationMethods(): void {
        const methods: (keyof BaseElement)[] = [
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
                    (this.root as Root)?.scheduleRender({ resize: false });
                };
            }
        }
    }
}

export type RuntimeConfig = {
    debounceMs?: number;
    altScreen?: boolean;
    exitOnCtrlC?: boolean;
} & ConfigureStdin;

export class Root extends BaseElement {
    public tagName: TTagNames;
    public hooks: RenderHooksManager;

    private scheduler: Scheduler;
    private renderer: Renderer;
    private stdin: Stdin;
    private config: RuntimeConfig;

    constructor(config: RuntimeConfig) {
        super();
        this.tagName = "ROOT_ELEMENT";
        this.config = this.initConfig();
        this.configure(config);

        // @ts-expect-error because refactor
        this.renderer = new Renderer();
        // @ts-expect-error because refactor
        this.scheduler = new Scheduler();
        // @ts-expect-error because refactor
        this.stdin = new Stdin();
        // @ts-expect-error because refactor
        this.hooks = new RenderHooksManager();
    }

    // Noop implementation in Root
    protected proxyStyleObject(): void {}

    private initConfig(): RuntimeConfig {
        return {
            debounceMs: 16,
            altScreen: false,
            stdout: process.stdout,
            enableMouse: true,
            mouseMode: 3,
            enableKittyProtocol: true,
            exitOnCtrlC: true,
        };
    }

    public configure(config: RuntimeConfig) {
        const prevScreenState = this.config.altScreen;

        Object.assign(this.config, config);

        this.scheduler.debounceMs = this.config.debounceMs ?? 16;
        this.handleScreenChange(prevScreenState, this.config.altScreen);
    }

    private render(opts: { screenChange: boolean }) {
        //
    }

    public scheduleRender(opts: { resize: boolean }) {
        //
    }

    private handleScreenChange(
        prevIsAlt: boolean | undefined,
        nextIsAlt: boolean | undefined,
        render = true,
    ) {
        // DEFAULT_SCREEN --> ALT_SCREEN
        if (!prevIsAlt && nextIsAlt) {
            process.stdout.write(Ansi.enterAltScreen);
            process.stdout.write(Ansi.cursor.position(1, 1));
            this.render({ screenChange: true });
        }

        // ALT_SCREEN --> DEFAULT_SCREEN
        else if (prevIsAlt && !nextIsAlt) {
            process.stdout.write(Ansi.exitAltScreen);
            if (render) this.render({ screenChange: true });
        }
    }
}
