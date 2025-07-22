export type PerformanceData = {
    layoutMs: number;
    writeMs: number;
    totalMs: number;
};

/**
 *
 * Track render performance and inspect with `Root.renderPerfHook`
 */
export class Performance {
    public tracking: boolean;
    private _preLayout: number;
    private _postLayout: number;
    private _preWrite: number;
    private _postWrite: number;

    constructor(tracking: boolean) {
        this.tracking = tracking;
        this._preLayout = 0;
        this._postLayout = 0;
        this._preWrite = 0;
        this._postWrite = 0;
    }

    public preLayout() {
        if (this.tracking) this._preLayout = performance.now();
    }
    public postLayout() {
        if (this.tracking) this._postLayout = performance.now();
    }
    public preWrite() {
        if (this.tracking) this._preWrite = performance.now();
    }
    public postWrite() {
        if (this.tracking) this._postWrite = performance.now();
    }

    public getPerf(): PerformanceData {
        return {
            layoutMs: this._postLayout - this._preLayout,
            writeMs: this._postWrite - this._preWrite,
            totalMs: this._postWrite - this._preLayout,
        };
    }
}
