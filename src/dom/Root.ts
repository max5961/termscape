import { Renderer } from "../render/Renderer.js";
import { RenderHooksManager } from "../render/RenderHooks.js";
import { Scheduler } from "./Scheduler.js";
import { DomElement, FriendDomElement } from "./DomElement.js";
import Yoga from "yoga-wasm-web/auto";
import type { EventEmitterMap, TTagNames } from "../types.js";
import { Emitter } from "../stdin/Stdin.js";
import { Event } from "./MouseEvent.js";
import ansi from "ansi-escape-sequences";

export type ConfigureRoot = {
    debounceMs?: number;
};

export class Root extends DomElement {
    private scheduler: Scheduler;
    private renderer: Renderer;
    public tagName: TTagNames;
    public style: {}; // abstract implementation noop;
    public hooks: RenderHooksManager;

    constructor({ debounceMs }: ConfigureRoot) {
        super();
        this.tagName = "ROOT_ELEMENT";
        this.scheduler = new Scheduler({ debounceMs: debounceMs });
        this.renderer = new Renderer();
        this.hooks = new RenderHooksManager(this.renderer.hooks);

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

    private render = (resize = false) => {
        this.node.calculateLayout();
        this.renderer.writeToStdout(resize);
    };

    public scheduleRender = () => {
        this.scheduler.scheduleUpdate(() => this.render());
    };

    public getLayoutHeight() {
        return this.renderer.lastCanvas?.grid.length ?? 0;
    }

    private findTargetElement(x: number, y: number): FriendDomElement | undefined {
        return this.renderer.rects.findTargetElement(x, y);
    }

    private handleMouseEvent: (...args: EventEmitterMap["eventOccured"]) => unknown = (
        x,
        y,
        type,
    ) => {
        const element = this.findTargetElement(x, y);
        if (!element) return;

        let propagationLegal = true;
        let immediatePropagationLegal = true;

        const propagate = (currentTarget: FriendDomElement, target: FriendDomElement) => {
            if (element && element.eventListeners[type].size) {
                const handlers = element.eventListeners[type];

                const event: Event = {
                    type,
                    clientX: x,
                    clientY: y,
                    target: target as unknown as DomElement,
                    currentTarget: currentTarget as unknown as DomElement,
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
                        h?.call(element, event);
                    }
                });
            }

            if (propagationLegal && element.parentElement) {
                propagate(element.parentElement as unknown as FriendDomElement, target);
            }
        };

        propagate(element, element);
    };

    private beginRuntime() {
        /***** Capture console *****/
        // This does support the scheduler...might need to extend Scheduler to accrue
        // logged output, so that renders can still be debounced when they are caused
        // by log statements.
        //
        // const capture = new Capture();
        // capture.on("output", (data) => {
        //     // with the `log` option, refresh clears all rows, writes the data
        //     // then writes the canvas
        //     this.renderer.render({ log: data })
        // })
        //
        // // never capture.end(), console methods should be captured for the
        // // entirety of the application
        // capture.start();

        /***** Cursor *****/
        process.stdout.write(ansi.cursor.hide);
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
                this.render(true);
            }, 8);
        };

        process.stdout.on("resize", handleResize);
        Emitter.on("eventOccured", this.handleMouseEvent);

        /***** Return cleanup function *****/
        return () => {
            process.stdout.off("resize", handleResize);
            Emitter.off("eventOccured", this.handleMouseEvent);
        };
    }
}

export const root = new Root({ debounceMs: 16 });
