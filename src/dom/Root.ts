import { Renderer } from "../render/Renderer.js";
import { RenderHooksManager } from "../render/RenderHooks.js";
import { Scheduler } from "../render/Scheduler.js";
import { TTagNames } from "./dom-types.js";
import { DomElement } from "./DomElement.js";
import Yoga from "yoga-wasm-web/auto";

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
    }

    public setAttribute(): void {}
    public addEventListener(): void {}

    public configure(c: ConfigureRoot): void {
        this.scheduler.debounceMs = c.debounceMs ?? 8;
    }

    private render = () => {
        this.node.calculateLayout();
        this.renderer.writeToStdout();
    };

    public scheduleRender = () => {
        this.scheduler.scheduleUpdate(() => this.render());
    };
}

export const root = new Root({ debounceMs: 16 });
