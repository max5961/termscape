import { Renderer } from "../render/Renderer.js";
import { RenderHooksManager } from "../render/RenderHooks.js";
import { Scheduler } from "./Scheduler.js";
import { DomElement, FriendDomElement } from "./DomElement.js";
import Yoga from "yoga-wasm-web/auto";
import type { TTagNames } from "../types.js";
import { Emitter } from "../stdin/Stdin.js";
import { Event } from "./MouseEvent.js";

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

        process.stdout.on("resize", () => {
            // Probably unnecessary, but doesn't hurt to make sure the term has
            // completed all tasks so that our repaints aren't overwritten by
            // repaints the terminal itself does.
            setTimeout(() => {
                this.render(true);
            }, 8);
        });

        Emitter.on("eventOccured", (x, y, type) => {
            const element = this.findTargetElement(x, y);

            console.log(element);

            let propagationLegal = true;
            const propagate = (element?: FriendDomElement) => {
                if (element && element.eventListeners[type].size) {
                    const handlers = element.eventListeners[type];

                    const event: Event = {
                        type,
                        clientX: x,
                        clientY: y,
                        target: element as unknown as DomElement,
                        stopPropagation: () => {
                            propagationLegal = false;
                        },
                    };

                    handlers.forEach((h) => {
                        h?.(event);
                    });
                }

                if (propagationLegal && element && element.parentElement) {
                    propagate(element.parentElement as unknown as FriendDomElement);
                }
            };

            propagate(element);
        });
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
}

export const root = new Root({ debounceMs: 16 });
