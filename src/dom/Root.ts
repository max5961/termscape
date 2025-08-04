import { Renderer, WriteOpts } from "../render/Renderer.js";
import { RenderHooksManager } from "../render/RenderHooks.js";
import { Scheduler } from "./Scheduler.js";
import { DomElement, FriendDomElement } from "./DomElement.js";
import Yoga from "yoga-wasm-web/auto";
import type { EventEmitterMap, TTagNames } from "../types.js";
import { Emitter, Stdin } from "../stdin/Stdin.js";
import { Event } from "./MouseEvent.js";
import ansi from "ansi-escape-sequences";
import { Capture } from "log-goblin";

export type ConfigureRoot = {
    debounceMs?: number;
};

export class Root extends DomElement {
    private scheduler: Scheduler;
    private renderer: Renderer;
    private stdin: Stdin;
    public tagName: TTagNames;
    public style: {}; // abstract implementation noop;
    public hooks: RenderHooksManager;

    constructor({ debounceMs }: ConfigureRoot) {
        super();
        this.tagName = "ROOT_ELEMENT";
        this.scheduler = new Scheduler({ debounceMs: debounceMs });
        this.renderer = new Renderer();
        this.hooks = new RenderHooksManager(this.renderer.hooks);
        this.stdin = new Stdin();

        this.style = {};
        this.node.setFlexWrap(Yoga.WRAP_NO_WRAP);
        this.node.setFlexDirection(Yoga.FLEX_DIRECTION_ROW);
        this.node.setFlexGrow(0);
        this.node.setFlexShrink(1);

        this.beginRuntime();
    }

    public setAttribute(): void {}

    public configure(c: ConfigureRoot): void {
        this.scheduler.debounceMs = c.debounceMs ?? 8;
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
        process.on("exit", () => process.stdout.write(ansi.cursor.show));
        process.on("SIGINT", () => {
            // process.stdout.write(ansi.cursor.show);

            // if (!this.renderer.lastWasRefresh) {
            //     process.stdout.write("\n");
            // }

            process.exit();
        });

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
        return () => {
            process.stdout.off("resize", handleResize);
            Emitter.off("MouseEvent", this.handleMouseEvent);
            this.stdin.pause();
        };
    }
}

export const root = new Root({ debounceMs: 16 });
