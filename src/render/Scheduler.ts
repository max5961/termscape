export class Scheduler {
    private debounceMs: number;
    private tickScheduled: boolean;
    private renderPending: boolean;
    private wait: boolean;
    // private updater: null | (() => unknown);

    constructor({ debounceMs }: { debounceMs?: number }) {
        this.debounceMs = debounceMs ?? 8;
        this.tickScheduled = false;
        this.renderPending = false;
        this.wait = false;
        // this.updater = null;
    }

    /**
     * Schedule calls to a synchronous `updater` callback.  Calls made during the
     * same event loop will be coalesced.  Calls to the updater will run at most
     * every `debounceMs` ms.
     */
    public scheduleUpdate = (updater: () => unknown) => {
        if (this.tickScheduled || this.renderPending) return;

        if (this.wait) {
            this.renderPending = true;
            return;
        }

        this.tickScheduled = true;
        process.nextTick(() => {
            this.tickScheduled = false;
            this.dispatchUpdater(updater);
        });
    };

    private dispatchUpdater(updater: () => unknown) {
        updater();

        this.wait = true;

        setTimeout(() => {
            if (this.renderPending) {
                return this.dispatchUpdater(updater);
            }

            this.wait = false;
            this.renderPending = false;
        }, this.debounceMs);
    }
}
