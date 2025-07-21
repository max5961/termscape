export class Scheduler {
    private debounceMs: number;
    private tickScheduled: boolean;
    private renderPending: boolean;
    private inTimeout: boolean;

    constructor({ debounceMs }: { debounceMs?: number }) {
        this.debounceMs = debounceMs ?? 8;
        this.tickScheduled = false;
        this.renderPending = false;
        this.inTimeout = false;
    }

    /**
     * Schedule calls to an updater callback.  Calls made during the same
     * event loop will be coalesced.  Calls to the updater will be debounced every
     * `debounceMs` ms.
     */
    public scheduleUpdate = (updater: () => unknown) => {
        if (this.tickScheduled) return;

        this.tickScheduled = true;
        process.nextTick(() => {
            this.tickScheduled = false;

            if (this.inTimeout) {
                this.renderPending = true;
                return;
            }

            updater();

            this.inTimeout = true;
            setTimeout(() => {
                if (this.renderPending) {
                    updater();
                }

                this.inTimeout = false;
                this.renderPending = false;
            }, this.debounceMs);
        });
    };
}
