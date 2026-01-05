import type { Root } from "../dom/RootElement.js";
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
    private isTestRoot: boolean;

    constructor({ isTestRoot }: { isTestRoot: boolean }) {
        this.debounceMs = 16;
        this.tickScheduled = false;
        this.wait = false;
        this.updater = null;
        this.capturedOutput = [];
        this.writeOpts = {};
        this.waitingOps = [];
        this.isTestRoot = !isTestRoot;
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

            this.execWaitingOps();
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

    // CHORE - Revisit this...but I think the right idea is to not debounce during
    // tests so that junk double event handlers aren't ran when rapidly sending
    // stdin events.

    /**
     * Used to have a `debounce` option here.  But, making it default **except**
     * for during testing code.  With debouncing enabled, behavior during slow
     * renders seems more natural to me.  That said, if you were to not debounce,
     * then `process.stdin` naturally debounces because it batches together
     * multiple keypresses made during long synchronous blocks of code, which
     * causes keymaps listening for a single keypress to no longer match.
     *
     * During testing however, debouncing should be turned off, since we want to
     * be able to send keypresses to a mock stdin with a minimal interval time
     * in order to keep the test runner from waiting.
     * */
    private execWaitingOps() {
        const nextOp = this.waitingOps.pop();
        nextOp?.();

        if (this.isTestRoot) {
            this.waitingOps = [];
        }
    }
}
