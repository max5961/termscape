import { Root } from "../dom/Root.js";

export class Scheduler {
    private root: Root;
    private debounceMs: number;
    private tickScheduled: boolean;
    private renderPending: boolean;
    private inTimeout: boolean;

    constructor({ root, debounceMs }: { root: Root; debounceMs?: number }) {
        this.root = root;
        this.debounceMs = debounceMs ?? 8;
        this.tickScheduled = false;
        this.renderPending = false;
        this.inTimeout = false;
    }

    public scheduleRender = (cb?: () => unknown) => {
        cb?.();

        if (this.tickScheduled) return;

        this.tickScheduled = true;
        process.nextTick(() => {
            this.tickScheduled = false;

            if (this.inTimeout) {
                this.renderPending = true;
                return;
            }

            this.root.render();

            this.inTimeout = true;
            setTimeout(() => {
                if (this.renderPending) {
                    this.root.render();
                }

                this.inTimeout = false;
                this.renderPending = false;
            }, this.debounceMs);
        });
    };
}
