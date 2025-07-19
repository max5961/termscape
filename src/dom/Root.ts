import { Scheduler } from "../render/Scheduler.js";
import { Document } from "./Document.js";
import { DomElement } from "./DomElement.js";

export class Root {
    public scheduler: Scheduler;
    public root: DomElement;

    constructor({ debounceMs }: { debounceMs?: number }) {
        this.root = Document.createElement("BOX_ELEMENT");
        this.scheduler = new Scheduler({ root: this, debounceMs: debounceMs });
    }

    public render() {
        //
    }
}
