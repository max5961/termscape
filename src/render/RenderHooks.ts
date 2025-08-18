import { Canvas } from "../compositor/Canvas.js";
import { type PerformanceData } from "./Performance.js";

type UnsubscribeCb = () => boolean;

export class RenderHooks {
    public postLayout: Set<(canvas: Canvas) => unknown>;
    public preWrite: Set<(stdout: string) => unknown>;
    public shouldRender: Set<() => boolean>;
    public renderPerf: Set<(perf: PerformanceData) => unknown>;

    constructor() {
        this.postLayout = new Set();
        this.preWrite = new Set();
        this.shouldRender = new Set();
        this.renderPerf = new Set();
    }

    /**
     * `true` if every callback in the `shouldRender` set returns `false`
     */
    public get renderIsBlocked() {
        return (
            this.shouldRender.size &&
            Array.from(this.shouldRender.values()).every((cb) => !cb())
        );
    }
}

export class RenderHooksManager {
    private hooks: RenderHooks;

    constructor(hooks: RenderHooks) {
        this.hooks = hooks;
    }

    /**
     * Draw to the finalized root canvas before its written to stdout.
     * */
    public postLayout = (cb: (canvas: Canvas) => unknown): UnsubscribeCb => {
        this.hooks.postLayout.add(cb);
        return () => this.hooks.postLayout.delete(cb);
    };

    /**
     * Inspect a copy of the rendered string before its written to stdout.  This
     * might be useful for testing, debugging, or piping stdout to a different
     * program.
     */
    public preWrite = (cb: (stdout: string) => unknown): UnsubscribeCb => {
        this.hooks.preWrite.add(cb);
        return () => this.hooks.preWrite.delete(cb);
    };

    /**
     * If all the registered `shouldRenderHooks` return false, then the rendered
     * string will not be written to stdout.
     *
     * This method should probably be a variable assignment, but to keep with the
     * same structure of the other hook methods, you can add multiple.
     */
    public shouldRender = (cb: () => boolean): UnsubscribeCb => {
        this.hooks.shouldRender.add(cb);
        return () => this.hooks.shouldRender.delete(cb);
    };

    /**
     * Passes an object
     */
    public renderPerf = (cb: (perf: PerformanceData) => unknown): UnsubscribeCb => {
        this.hooks.renderPerf.add(cb);
        return () => this.hooks.renderPerf.delete(cb);
    };
}
