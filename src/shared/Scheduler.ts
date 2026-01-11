import type { Root } from "../dom/RootElement.js";
import type { TestRoot } from "../testing/TestRoot.js";
import type { WriteOpts } from "../Types.js";
import { objectKeys } from "../Util.js";

type Updater = Root["render"];

export class Scheduler {
    public debounceMs: number;
    protected tickScheduled: boolean;
    protected wait: boolean;
    protected updater: null | Updater;
    protected capturedOutput: string[];
    protected writeOpts: WriteOpts;
    protected waitingOps: (() => unknown)[];

    protected setWait(b: boolean) {
        this.wait = b;
    }

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

    protected dispatchUpdater() {
        if (this.updater) {
            // Join together captured output, then reset BEFORE the updater runs.
            // By resetting before the updater runs, this allows Renderer methods
            // to accrue console output and render hooks to utilize logging
            const consoleOutput = this.capturedOutput.join("");
            this.writeOpts.capturedOutput = consoleOutput;
            this.capturedOutput = [];

            this.updater(this.writeOpts);
        }

        this.writeOpts = {};
        this.updater = null;
        this.setWait(true);

        setTimeout(() => {
            if (this.updater) {
                this.dispatchUpdater();
            } else {
                this.setWait(false);
            }

            this.execWaitingOps();
        }, this.debounceMs);
    }

    /**
     * Overwrites anything not true, which allows captured console output to
     * overwrite previous.
     */
    protected mergeOpts(opts: WriteOpts) {
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
     * Used to have a `debounce` option here, but making it default.  With debouncing enabled, behavior during slow
     * renders seems more natural to me.
     *
     * Important to note: `process.stdin` batches together keypresses made during long synchronous blocks of code.
     * For example, 5 'a' keypresses get batched together as 'aaaaa', and this causes keypresses to not match key
     * listeners anyways.
     *
     * Debounce behavior is overridden in TestScheduler to allow testing operations in order.
     * */
    protected execWaitingOps() {
        const nextOp = this.waitingOps.pop();
        nextOp?.();

        this.waitingOps = [];
    }

    public pushWaitingOps(...ops: (() => unknown)[]) {
        this.waitingOps.push(...ops);
    }
}

export class TestScheduler extends Scheduler {
    private host: TestRoot;
    private firstWait = false;
    private afterFirstWait: (() => unknown)[] = [];

    protected override setWait(b: boolean): void {
        this.wait = b;

        if (b && !this.firstWait) {
            this.firstWait = true;
            for (const batch of this.afterFirstWait) batch();
        }
    }

    constructor(host: TestRoot) {
        super();
        this.host = host;
    }

    public override execWhenFree(op: () => unknown) {
        this.waitingOps.push(op);
    }

    public override execWaitingOps(): void {
        // Shift ops instead of popping as in non-test.  Popping allows for debounce-like behavior, whereas
        // in testing we want all ops to exec in queue-like fashion.
        const nextOp = this.waitingOps.shift();
        nextOp?.();

        this.host.exitIfDone(nextOp);
    }

    public sendOps(ops: (string | (() => unknown))[]): void {
        this.afterFirstWait.push(() => {
            ops.forEach((op) => {
                if (typeof op === "string") {
                    this.host.runtime.stdin.write(Buffer.from(op));
                } else {
                    this.execWhenFree(op);
                }
            });
        });
    }
}
