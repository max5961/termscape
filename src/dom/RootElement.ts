import { Scheduler } from "../render/Scheduler.js";
import { DomElement, MetaData, Props } from "./DomElement.js";
import { Event, EventHandler } from "./MouseEvent.js";

export class RootElement extends DomElement {
    public scheduler: Scheduler;

    constructor() {
        super();
        this.isRoot = true;
        this.scheduler = new Scheduler({ root: this, debounceMs: 8 });
    }

    public setAttributes(props: Props & MetaData): void {}
    public addEventListener(): void {}

    public handleMouseEvent(e: Event) {
        // 1) Update real screen positions for each element
        // 2) Handle mouse events (which is post order traversal so that leaf nodes
        // are handled first and can stop propagation)
        //
        // RootElement does not actually handle any traversal itself

        for (const child of this.children) {
            // imported CURSOR_POSITION_Y would be updated before every render/paint
            // and would reflect the final terminal row before the TUI.  That way
            // clicking is possible without fullscreen mode

            // child.updateScreenPosition(0, CURSOR_POSITION_Y);
            child.updateScreenPosition(0, 0);
        }

        const handlers = {} as Record<number, EventHandler[]>;
        for (const child of this.children) {
            child.handleEvent(e, handlers);
        }

        let stopped = false;
        e.stopPropagation = () => (stopped = true);
        Object.freeze(e);
        const keys = Object.keys(handlers).sort();
        for (let i = keys.length - 1; i >= 0; --i) {
            const zindex = Number(keys[i]);

            for (let j = 0; j < handlers[zindex].length; ++j) {
                if (stopped) {
                    break;
                }
                handlers[zindex]?.[j]?.(e);
            }
        }
    }
}
