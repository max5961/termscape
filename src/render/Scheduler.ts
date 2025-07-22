export class Scheduler {
    public debounceMs: number;
    private tickScheduled: boolean;
    private wait: boolean;
    private updater: null | (() => unknown);

    constructor({ debounceMs }: { debounceMs?: number }) {
        this.debounceMs = debounceMs ?? 8;
        this.tickScheduled = false;
        this.wait = false;
        this.updater = null;
    }

    /**
     * Schedule calls to a synchronous `updater` callback.  Calls made during the
     * same event loop will be coalesced.  Calls to the updater may run only once
     * every `debounceMs` ms.
     */
    public scheduleUpdate = (updater: () => unknown) => {
        this.updater = updater;

        if (this.tickScheduled || this.wait) return;

        this.tickScheduled = true;
        process.nextTick(() => {
            this.tickScheduled = false;
            this.dispatchUpdater();
        });
    };

    private dispatchUpdater() {
        this.updater?.();
        this.updater = null;
        this.wait = true;

        setTimeout(() => {
            if (this.updater) {
                return this.dispatchUpdater();
            }
            this.wait = false;
        }, this.debounceMs);
    }
}
