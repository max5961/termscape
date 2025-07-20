import { Renderer } from "../layout/Renderer.js";
import { Scheduler } from "../render/Scheduler.js";
import { TTagNames } from "./dom-types.js";
import { DomElement } from "./DomElement.js";
import Yoga from "yoga-wasm-web/auto";

export class Root extends DomElement {
    public scheduler: Scheduler;
    public renderer: Renderer;
    public tagName: TTagNames;
    public static current: Root;
    public style: {}; // noop;

    constructor({ debounceMs }: { debounceMs?: number }) {
        super();
        this.tagName = "ROOT_ELEMENT";
        this.renderer = new Renderer(this);
        this.scheduler = new Scheduler({ root: this, debounceMs: debounceMs });

        this.style = {};
        this.node.setFlexWrap(Yoga.WRAP_NO_WRAP);
        this.node.setFlexDirection(Yoga.FLEX_DIRECTION_ROW);
        this.node.setFlexGrow(0);
        this.node.setFlexShrink(1);

        Root.current = this;
    }

    public setAttribute(): void {}
    public addEventListener(): void {}

    public render = () => {
        this.node.calculateLayout();
        this.renderer.writeToStdout();
    };

    public scheduleRender = () => {
        this.scheduler.scheduleRender();
    };
}

Root.current = new Root({ debounceMs: 16 });
