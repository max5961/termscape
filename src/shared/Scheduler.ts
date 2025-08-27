import { Root } from "../dom/Root.js";
import type { WriteOpts } from "../Types.js";
import { objectKeys } from "../Util.js";

type Updater = Root["render"];

export class Scheduler {
    public debounceMs: number;
    private tickScheduled: boolean;
    private wait: boolean;
    private updater: null | Updater;
    private capturedOutput: string[];
    private writeOpts: WriteOpts;

    constructor() {
        this.debounceMs = 16;
        this.tickScheduled = false;
        this.wait = false;
        this.updater = null;
        this.capturedOutput = [];
        this.writeOpts = {};
    }

    /**
     * Schedule calls to a synchronous `updater` callback.  Calls made during the
     * same event loop will be coalesced.  Calls to the updater may run only once
     * every `debounceMs` ms.
     */
    public scheduleUpdate = (updater: Updater, opts: WriteOpts) => {
        this.updater = updater;
        this.mergeOpts(opts);

        if (opts.capturedOutput) {
            this.capturedOutput.push(opts.capturedOutput);
        }

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
            this.writeOpts.capturedOutput = console;
            this.capturedOutput = [];

            this.updater(this.writeOpts);
        }

        this.writeOpts = {};
        this.updater = null;
        this.wait = true;

        setTimeout(() => {
            if (this.updater) {
                return this.dispatchUpdater();
            }
            this.wait = false;
        }, this.debounceMs);
    }

    /**
     * Overwrites anything not true, which allows captured console output to
     * overwrite previous.
     */
    private mergeOpts(opts: WriteOpts) {
        for (const key of objectKeys(opts)) {
            if (this.writeOpts[key] !== true) {
                // @ts-ignore
                this.writeOpts[key] = opts[key];
            }
        }
    }
}
