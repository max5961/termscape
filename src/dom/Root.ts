import { Renderer, WriteOpts } from "../render/Renderer.js";
import { RenderHooksManager } from "../render/RenderHooks.js";
import { Scheduler } from "./Scheduler.js";
import { DomElement, FriendDomElement } from "./DomElement.js";
import Yoga from "yoga-wasm-web/auto";
import type { ConfigureStdin, EventEmitterMap, TTagNames } from "../types.js";
import { Emitter, Stdin } from "../stdin/Stdin.js";
import { Event } from "./MouseEvent.js";
import ansi from "ansi-escape-sequences";
import { Capture } from "log-goblin";
import { Ansi } from "../util/Ansi.js";
import { configureStdin } from "term-keymap";
import { BoxElement } from "./elements/BoxElement.js";
import { TextElement } from "./elements/TextElement.js";

export type ConfigureRoot = {
    debounceMs?: number;
    altScreen?: boolean;
} & ConfigureStdin;

export class Root extends DomElement {
    private scheduler: Scheduler;
    private renderer: Renderer;
    private stdin: Stdin;
    public style: {}; // abstract implementation noop;
    public hooks: RenderHooksManager;
    private prevConfig: ConfigureRoot;
    private isAltScreen: boolean;

    /** Safely exit app.  Most importantly, this makes sure that kitty protocol
     * is reset, which ensures proper term functioning post exit. */
    public exit: ReturnType<Root["beginRuntime"]>;

    constructor(c: ConfigureRoot) {
        super(null, "ROOT_ELEMENT");
        this.scheduler = new Scheduler({ debounceMs: c.debounceMs });
        this.renderer = new Renderer();
        this.hooks = new RenderHooksManager(this.renderer.hooks);
        this.stdin = new Stdin(this);

        this.style = {};
        this.node.setFlexWrap(Yoga.WRAP_NO_WRAP);
        this.node.setFlexDirection(Yoga.FLEX_DIRECTION_ROW);
        this.node.setFlexGrow(0);
        this.node.setFlexShrink(1);

        this.isAltScreen = false;
        this.prevConfig = {};
        this.configure(c);

        const cleanup = this.beginRuntime();
        this.exit = cleanup;
    }

    public setAttribute(): void {}

    public configure(c: ConfigureRoot): void {
        /** Allow updates to individual keys without defaulting those previously set. */
        const update = <T extends keyof ConfigureRoot>(
            prop: T,
            dft: ConfigureRoot[T],
        ): Pick<ConfigureRoot, T> => {
            return { [prop]: c[prop] ?? this.prevConfig[prop] ?? dft } as Pick<
                ConfigureRoot,
                T
            >;
        };

        const nextConfig: ConfigureRoot = {
            ...update("debounceMs", 16),
            ...update("altScreen", false),
            ...update("stdout", process.stdout),
            ...update("enableMouse", true),
            ...update("mouseMode", 3),
            ...update("enableKittyProtocol", true),
        };

        configureStdin(nextConfig);
        this.scheduler.debounceMs = nextConfig.debounceMs!;

        if (this.prevConfig.altScreen !== nextConfig.altScreen) {
            if (nextConfig.altScreen && !this.isAltScreen) {
                process.stdout.write(Ansi.enterAltScreen);
                process.stdout.write(Ansi.cursor.position(1, 1));
                this.isAltScreen = true;
                this.render({ screenChange: true });
            } else if (!nextConfig.altScreen && this.isAltScreen) {
                process.stdout.write(Ansi.exitAltScreen);
                this.isAltScreen = false;
                this.render({ screenChange: true });
            }
        }

        this.prevConfig = nextConfig;
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

    public scheduleRender = (opts: WriteOpts) => {
        this.scheduler.scheduleUpdate(this.render, opts.capturedOutput);
    };

    public getLayoutHeight() {
        return this.renderer.lastCanvas?.grid.length ?? 0;
    }

    private findTargetElement(x: number, y: number): FriendDomElement | undefined {
        return this.renderer.rects.findTargetElement(x, y);
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

    private beginRuntime() {
        /***** Capture console *****/
        const capture = new Capture();
        capture.on("output", (data) => {
            this.scheduleRender({ resize: false, capturedOutput: data });
        });
        capture.start();

        /***** Cursor *****/
        if (!process.env.RENDER_DEBUG) {
            process.stdout.write(ansi.cursor.hide);
        }

        /***** Set Listeners *****/
        // setTimeout to ensure that the term has completed all tasks so that repaints
        // aren't overwritten by repaints from the terminal itself.  Most likely
        // this occurs before the resize event is dispatched, but it doesn't hurt.
        const handleResize = () => {
            setTimeout(() => {
                this.render({ resize: true });
            }, 8);
        };

        process.stdout.on("resize", handleResize);
        Emitter.on("MouseEvent", this.handleMouseEvent);

        /***** Stdin *****/
        this.stdin.listen();

        /***** Return cleanup function *****/
        return <T extends Error | undefined>(err?: T) => {
            process.stdout.write(Ansi.exitAltScreen);
            process.stdout.write(Ansi.cursor.show);

            // term-keymap *does* write this on exit, but it wasn't reliably
            // taking effect, so running this is part of the cleanup function
            // makes it more reliable.  Must be ran *after* exiting the alt screen.
            // If kitty mode is enabled, the mode MUST be restored for normal
            // term functioning after app exits.
            process.stdout.write("\x1b[<u");

            process.stdout.off("resize", handleResize);
            Emitter.off("MouseEvent", this.handleMouseEvent);
            this.stdin.pause();

            this.hooks.shouldRender(() => false);

            // Once we have listened to stdin, the default ctrl-c no longer works,
            // so if the app contains any running loops this behavior should
            // still occur.
            process.stdin.resume();
            process.stdin.setRawMode(true);
            process.stdin.on("data", (buf) => {
                if (buf[0] === 3 || buf.toString("utf8") === "\x1b[99;5u") {
                    process.stdout.write("^C\n");
                    process.exit();
                }
            });

            if (err && err instanceof Error) {
                throw err;
            }

            return undefined as T extends Error ? never : void;
        };
    }

    public createElement(tagName: TTagNames) {
        if (tagName === "BOX_ELEMENT") {
            return new BoxElement(this);
        }

        return this.exit(new Error("Invalid element tagName"));
    }

    public createTextElement(tagName: TTagNames, textContent: string) {
        if (tagName === "TEXT_ELEMENT") {
            return new TextElement(this, textContent);
        }

        return this.exit(new Error("Invalid textElement tagName"));
    }
}

export const root = new Root({ debounceMs: 16 });
