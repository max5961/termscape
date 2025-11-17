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
    private waitingOps: (() => unknown)[];

    constructor() {
        this.debounceMs = 16;
        this.tickScheduled = false;
        this.wait = false;
        this.updater = null;
        this.capturedOutput = [];
        this.writeOpts = {};
        this.waitingOps = [];
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
            /*
             * Join together captured output, then reset BEFORE the updater runs.
             * By resetting before the updater runs, this allows Renderer methods
             * to accrue console output and render hooks to utilize logging
             */
            const consoleOutput = this.capturedOutput.join("");
            this.writeOpts.capturedOutput = consoleOutput;
            this.capturedOutput = [];

            this.updater(this.writeOpts);
        }

        this.writeOpts = {};
        this.updater = null;
        this.wait = true;

        setTimeout(() => {
            if (this.updater) {
                this.dispatchUpdater();
            } else {
                this.wait = false;
            }

            this.execWaitingOps(true);

            // if (this.updater) {
            //     /*
            //      * Moving `execWaitingOps` to run after running the updater. When
            //      * `execWaitingOps` previously ran after the `wait` assignment,
            //      * it worked to prevent pollution of keymap events during rendering
            //      * but blocked the exec of keymaps during animations/transitions
            //      * below the `debounceMs`.
            //      */
            //     this.dispatchUpdater();
            //     return this.execWaitingOps(true);
            // }
            // this.wait = false;
            // this.execWaitingOps(true);
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

    /**
     * Prevents stdin events from polluting the dom tree during rendering.
     * */
    public execWhenFree(op: () => unknown) {
        if (!this.wait) {
            op();
        } else {
            this.waitingOps.push(op);
        }
    }

    /**
     * `debounce` to false might be useful when reading text input, but otherwise
     * if lag is high enough to cause timing issues with rendering and stdin events
     * then executing all ops at once is less smooth and sometimes still causes
     * issues.
     * */
    private execWaitingOps(debounce: boolean) {
        if (debounce) {
            const nextOp = this.waitingOps.pop();
            nextOp?.();
            this.waitingOps = [];
        } else {
            this.waitingOps.forEach((op) => op());
            this.waitingOps = [];
        }
    }
}
