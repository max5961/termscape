import { Root } from "./Root.js";

type Updater = (typeof Root)["prototype"]["render"];

export class Scheduler {
    public debounceMs: number;
    private tickScheduled: boolean;
    private wait: boolean;
    private updater: null | Updater;
    private capturedOutput: string[];

    constructor({ debounceMs }: { debounceMs?: number }) {
        this.debounceMs = debounceMs ?? 8;
        this.tickScheduled = false;
        this.wait = false;
        this.updater = null;
        this.capturedOutput = [];
    }

    /**
     * Schedule calls to a synchronous `updater` callback.  Calls made during the
     * same event loop will be coalesced.  Calls to the updater may run only once
     * every `debounceMs` ms.
     */
    public scheduleUpdate = (updater: Updater, capturedOutput?: string) => {
        this.updater = updater;
        if (capturedOutput) this.capturedOutput.push(capturedOutput);

        if (this.tickScheduled || this.wait) return;

        this.tickScheduled = true;
        process.nextTick(() => {
            this.tickScheduled = false;
            this.dispatchUpdater();
        });
    };

    private dispatchUpdater() {
        if (this.updater) {
            // Join together captured output, then reset BEFORE the updater runs.
            // By resetting before the updater runs, this allows Renderer methods
            // to accrue console output and render hooks to utilize logging
            const console = this.capturedOutput.join("");
            this.capturedOutput = [];

            this.updater({ resize: false, capturedOutput: console });
        }

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
