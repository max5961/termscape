import { Renderer, WriteOpts } from "../render/Renderer.js";
import { RenderHooksManager } from "../render/RenderHooks.js";
import { Scheduler } from "./Scheduler.js";
import { DomElement, FriendDomElement } from "./DomElement.js";
import Yoga from "yoga-wasm-web/auto";
import type { ConfigureStdin, EventEmitterMap, TTagNames } from "../types.js";
import { Emitter, Stdin } from "../stdin/Stdin.js";
import { Event } from "./MouseEvent.js";
import { Capture } from "log-goblin";
import { Ansi } from "../util/Ansi.js";
import { Action, configureStdin } from "term-keymap";
import { BoxElement } from "./elements/BoxElement.js";
import { TextElement } from "./elements/TextElement.js";

export type RuntimeConfig = {
    debounceMs?: number;
    altScreen?: boolean;
    exitOnCtrlC?: boolean;
} & ConfigureStdin;

export class Root extends DomElement {
    private scheduler: Scheduler;
    private renderer: Renderer;
    private stdin: Stdin;
    public style: {}; // abstract implementation noop;
    public hooks: RenderHooksManager;
    private config: RuntimeConfig;
    private isAltScreen: boolean;
    private cleanupHandlers: Map<string, () => void>;

    /** Safely exit app.  Most importantly, this makes sure that kitty protocol
     * is reset, which ensures proper term functioning post exit. */
    public endRuntime: ReturnType<Root["startRuntime"]>;

    constructor(c: RuntimeConfig = {}) {
        super(null, "ROOT_ELEMENT", () => {});
        this.isAttached = true;
        this.style = {};
        this.node.setFlexWrap(Yoga.WRAP_NO_WRAP);
        this.node.setFlexDirection(Yoga.FLEX_DIRECTION_ROW);
        this.node.setFlexGrow(0);
        this.node.setFlexShrink(1);

        this.scheduler = new Scheduler({ debounceMs: c.debounceMs });
        this.renderer = new Renderer(this);
        this.hooks = new RenderHooksManager(this.renderer.hooks);

        this.isAltScreen = false;
        this.cleanupHandlers = new Map();
        this.config = {};
        this.configure(c);

        this.stdin = new Stdin(this, this.config);

        this.endRuntime = this.startRuntime();
    }

    public setAttribute(): void {}

    public configure(c: RuntimeConfig): void {
        /** Allow updates to individual keys without defaulting those previously set. */
        const update = <T extends keyof RuntimeConfig>(
            prop: T,
            dft: RuntimeConfig[T],
        ): Pick<RuntimeConfig, T> => {
            return { [prop]: c[prop] ?? this.config[prop] ?? dft } as Pick<
                RuntimeConfig,
                T
            >;
        };

        const nextConfig: RuntimeConfig = {
            ...update("debounceMs", 16),
            ...update("altScreen", false),
            ...update("stdout", process.stdout),
            ...update("enableMouse", true),
            ...update("mouseMode", 3),
            ...update("enableKittyProtocol", false),
            ...update("exitOnCtrlC", true),
        };

        this.scheduler.debounceMs = nextConfig.debounceMs!;
        this.handleScreenChange(this.config.altScreen, nextConfig.altScreen);
        Object.assign(this.config, nextConfig);
    }

    public useAltScreen(): void {
        this.configure({ altScreen: true });
    }

    public useDefaultScreen(): void {
        this.configure({ altScreen: false });
    }

    private render = (opts: WriteOpts) => {
        this.node.calculateLayout(process.stdout.columns, undefined, Yoga.DIRECTION_LTR);
        this.renderer.writeToStdout(opts);
    };

    protected scheduleRender = (opts: WriteOpts) => {
        this.scheduler.scheduleUpdate(this.render, opts.capturedOutput);
    };

    public getLayoutHeight() {
        return this.renderer.lastCanvas?.grid.length ?? 0;
    }

    private findTargetElement(x: number, y: number): FriendDomElement | undefined {
        return this.renderer.rects.findTargetElement(x, y);
    }

    private startRuntime() {
        this.startStdin(); // This should be conditional based on adding an input event listener
        this.startConsoleCapture();
        this.startCursorHide();
        this.startResizeHandler();
        this.startMouseListening();

        this.updateAttachState(this, true);

        return <T extends Error | undefined>(err?: T) => {
            this.handleScreenChange(this.isAltScreen, false, false);

            this.cleanupHandlers.forEach((handler) => {
                handler();
            });

            this.updateAttachState(this, false);

            if (err && err instanceof Error) {
                throw err;
            }

            return undefined as T extends Error ? never : void;
        };
    }

    private updateCleanupHandler(key: string, handler: () => void) {
        this.cleanupHandlers.get(key)?.();
        this.cleanupHandlers.set(key, handler);
    }

    private startStdin() {
        configureStdin(this.config);
        this.stdin.listen();
        this.updateCleanupHandler("STDIN", () => this.stdin.pause());
    }

    private startConsoleCapture() {
        const capture = new Capture();
        capture.on("output", (data) => {
            this.scheduleRender({ resize: false, capturedOutput: data });
        });
        capture.start();

        this.updateCleanupHandler("CONSOLE_CAPTURE", () => capture.stop());
    }

    private startCursorHide() {
        const debug = process.env.RENDER_DEBUG;
        if (!debug) {
            process.stdout.write(Ansi.cursor.hide);
        }
        this.updateCleanupHandler(
            "CURSOR_HIDE",
            () => !debug && process.stdout.write(Ansi.cursor.show),
        );
    }

    private startResizeHandler() {
        const handler = () => {
            // setTimeout ensures the term has completed all tasks so that re-renders
            // aren't overwritten by the terminal itself.  Most likely this occurs
            // before the resize event is dispatched, but it doesn't hurt.
            setTimeout(() => {
                this.render({ resize: true });
            }, 8);
        };

        process.stdout.on("resize", handler);
        this.updateCleanupHandler("RESIZE", () => process.stdout.off("resize", handler));
    }

    private startMouseListening() {
        // Ideally, `term-keymap` should have a
        // `const restore = configure("mouse", mouseSetting);` function
        Emitter.on("MouseEvent", this.handleMouseEvent);
        this.updateCleanupHandler("MOUSE_EVENT", () =>
            Emitter.off("MouseEvent", this.handleMouseEvent),
        );
    }

    private handleMouseEvent: (...args: EventEmitterMap["MouseEvent"]) => unknown = (
        x,
        y,
        type,
    ) => {
        const element = this.findTargetElement(x, y);
        if (!element) return;

        let propagationLegal = true;
        let immediatePropagationLegal = true;

        const propagate = (curr: FriendDomElement, target: FriendDomElement) => {
            if (curr && curr.eventListeners[type].size) {
                const handlers = curr.eventListeners[type];

                const event: Event = {
                    type,
                    clientX: x,
                    clientY: y,
                    target: target as unknown as DomElement,
                    currentTarget: curr as unknown as DomElement,
                    stopPropagation: () => {
                        propagationLegal = false;
                    },
                    stopImmediatePropagation: () => {
                        immediatePropagationLegal = false;
                        propagationLegal = false;
                    },
                };

                handlers.forEach((h) => {
                    if (immediatePropagationLegal) {
                        h?.call(curr, event);
                    }
                });
            }

            if (propagationLegal && curr.parentElement) {
                propagate(curr.parentElement as unknown as FriendDomElement, target);
            }
        };

        propagate(element, element);
    };

    private handleScreenChange(
        prevIsAlt: boolean | undefined,
        nextIsAlt: boolean | undefined,
        render = true,
    ) {
        // DEFAULT_SCREEN --> ALT_SCREEN
        if (!prevIsAlt && nextIsAlt) {
            process.stdout.write(Ansi.enterAltScreen);
            process.stdout.write(Ansi.cursor.position(1, 1));
            this.isAltScreen = true;
            this.root.render({ screenChange: true });
        }

        // ALT_SCREEN --> DEFAULT_SCREEN
        else if (prevIsAlt && !nextIsAlt) {
            process.stdout.write(Ansi.exitAltScreen);
            this.isAltScreen = false;
            if (render) this.render({ screenChange: true });
        }
    }

    public createElement(tagName: TTagNames) {
        if (tagName === "BOX_ELEMENT") {
            return new BoxElement(this, this.scheduleRender);
        }

        return this.endRuntime(new Error("Invalid element tagName"));
    }

    public createTextNode(tagName: TTagNames, textContent: string) {
        if (tagName === "TEXT_ELEMENT") {
            return new TextElement(this, textContent, this.scheduleRender);
        }

        return this.endRuntime(new Error("Invalid textElement tagName"));
    }

    public addKeyListener(action: Action) {
        return this.stdin.subscribe(action);
    }

    public removeKeyListener(action: Action) {
        this.stdin.remove(action);
    }
}
