import { Renderer } from "../layout/Renderer.js";
import { Scheduler } from "../render/Scheduler.js";
import { DomElement } from "./DomElement.js";

export class Root extends DomElement {
    public scheduler: Scheduler;
    public renderer: Renderer;

    constructor({ debounceMs }: { debounceMs?: number }) {
        super();
        this.root = this;
        this.tagName = "ROOT_ELEMENT";
        this.renderer = new Renderer(this);
        this.scheduler = new Scheduler({ root: this, debounceMs: debounceMs });
    }

    public setAttribute(): void {}
    public addEventListener(): void {}

    public render() {
        this.renderer.writeToStdout();
    }

    public requestRender() {
        this.scheduler.scheduleRender();
    }
}

export const root = new Root({ debounceMs: 16 });
