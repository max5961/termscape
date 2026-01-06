import type { Root } from "../dom/RootElement.js";
import type { WriteOpts } from "../Types.js";
import type { Grid } from "../compositor/Canvas.js";
import { Compositor } from "../compositor/Compositor.js";
import { Cursor, DebugCursor } from "./Cursor.js";
import { WriterRefresh } from "./writer/WriterRefresh.js";
import { WriterCell } from "./writer/WriterCell.js";
import { isFullscreen, objectKeys } from "../Util.js";
import { DomRects } from "../compositor/DomRects.js";
import { Ansi } from "../shared/Ansi.js";
import { logger } from "../shared/Logger.js";

export class Renderer {
    private readonly _host: Root;
    private readonly _cursor: Cursor;
    private readonly _cellWriter: WriterCell;
    private readonly _refreshWriter: WriterRefresh;
    private _sinceResize: number;
    private _lastCompositor: Compositor | undefined;
    private _lastGrid: Grid | undefined;
    private _rects: Readonly<DomRects>;

    public get rects() {
        return this._rects;
    }
    public get lastGrid() {
        return this._lastGrid;
    }

    constructor(host: Root) {
        this._host = host;
        this._cursor = process.env["RENDER_DEBUG"]
            ? new DebugCursor(host)
            : new Cursor(host);
        this._cellWriter = new WriterCell(this._cursor, host);
        this._refreshWriter = new WriterRefresh(this._cursor, host);
        this._lastGrid = undefined;
        this._lastCompositor = undefined;
        this._rects = new DomRects();
        this._sinceResize = 0;
    }

    public renderTree(opts: WriteOpts) {
        if (this.checkIfBlockedRender()) return;
        this.handleResizeCounter(opts);

        // Create layout/grid
        this._host.hooks.exec("pre-layout", undefined);
        const [layoutMs, compositor] = this.wrapPerf(() => this.getComposedLayout(opts));
        this._host.hooks.exec("post-layout", compositor.canvas);

        const _lastGrid = this._lastGrid;
        const nextGrid = compositor.canvas.grid;
        this._lastCompositor = compositor;
        this._lastGrid = nextGrid;
        this._rects = compositor.rects;

        // Load cursor with operations and execute
        this._host.hooks.exec("pre-write", undefined);
        const [diffMs, didRefreshWrite] = this.wrapPerf(() => {
            return this.prepareCursorOps(opts, _lastGrid, nextGrid);
        });
        this.executeCursorOps();
        this._host.hooks.exec("post-write", undefined);

        this._host.hooks.exec("performance", {
            layoutMs,
            diffMs,
            diffStrategy: didRefreshWrite ? "refresh" : "cell",
        });
    }

    private wrapPerf<T>(cb: () => T): [number, T] {
        const start = performance.now();
        const result = cb();
        const end = performance.now();
        return [end - start, result];
    }

    private executeCursorOps() {
        const stdout = this._host.runtime.stdout;
        stdout.write(Ansi.beginSynchronizedUpdate);
        this._cursor.execute();
        stdout.write(Ansi.endSynchronizedUpdate);
    }

    private prepareCursorOps(
        opts: WriteOpts,
        _lastGrid: Grid | undefined,
        nextGrid: Grid,
    ) {
        const shouldRefresh = this.shouldRefreshWrite(opts, nextGrid);
        if (shouldRefresh || !_lastGrid) {
            this._refreshWriter.instructCursor(_lastGrid, nextGrid, opts.capturedOutput);
        } else {
            this._cellWriter.instructCursor(_lastGrid, nextGrid);
            this._refreshWriter.resetLastOutput();
        }

        this._cursor.moveToRow(nextGrid.length - 1);
        return shouldRefresh;
    }

    private getComposedLayout(opts: WriteOpts): Compositor {
        let compositor: Compositor;
        if (this.onlyStyleChange(opts) && this._lastCompositor) {
            compositor = this.redrawLastGrid(this._lastCompositor);
        } else {
            compositor = this.composeNewLayout(opts);
        }
        return this.reconcileLayout(compositor);
    }

    private composeNewLayout(opts: WriteOpts): Compositor {
        const compositor = new Compositor(this._host, opts);
        compositor.buildLayout(this._host);
        return compositor;
    }

    /**
     * Assumes no layout work is needed but styles (coloring, borders, etc...)
     * need to be updated.
     * */
    private redrawLastGrid(compositor: Compositor): Compositor {
        // reset grid while preserving references, then re-perform draw ops

        this._lastGrid = compositor.canvas.grid.map((row) => row.slice());

        compositor.canvas.grid.splice(0);
        this._lastGrid.forEach((row) => {
            const nextRow = Array.from({ length: row.length }).fill(" ") as string[];
            compositor.canvas.grid.push(nextRow);
        });

        compositor.draw.performOps();
        return compositor;
    }

    private onlyStyleChange(opts: WriteOpts): boolean {
        const keys = objectKeys(opts);
        if (keys.length <= 2 && opts.capturedOutput !== undefined && opts.styleChange) {
            return true;
        }
        return false;
    }

    private reconcileLayout(compositor: Compositor): Compositor {
        const recompose = (cb: () => boolean) => {
            if (cb()) {
                logger.write("RECOMPOSE");
                compositor = this.composeNewLayout({ layoutChange: true });
            }
        };

        // Order Matters: CB -> Yoga -> Recompose
        const withYoga = (cb: () => boolean) => {
            recompose(() => {
                const result = cb();
                if (result) this._host._calculateYogaLayout();
                return result;
            });
        };

        const sorted = compositor.reconciler.getSorted();
        sorted.scrollManagers.forEach(recompose);
        sorted.focusManagers.forEach(recompose);
        sorted.afterLayout.forEach(withYoga);

        return compositor;
    }

    private shouldRefreshWrite(opts: WriteOpts, nextGrid: Grid) {
        if (!this._host.runtime.cellWrite) return true;
        if (!this._lastCompositor) return true;
        if (opts.resize) return true;
        if (opts.screenChange) return true;
        if (opts.capturedOutput && !this.isFullscreen(nextGrid)) return true;
        if (this._sinceResize < 2) return true;
        if (!this.termSupportsAnsiCursor()) return true;
        return false;
    }

    private isFullscreen(grid: Grid): boolean {
        return isFullscreen(grid, this._host.runtime.stdout);
    }

    /**
     * Greenlight only terminals that *definitely* support ansi cursor control to
     * use the cell write strategy.
     */
    private termSupportsAnsiCursor(): boolean {
        const term = process.env["TERM"];
        return !!term?.match(/xterm|kitty|alacritty|ghostty/);
    }

    private checkIfBlockedRender(): boolean {
        const handlers = this._host.hooks.getHookSet("block-render");
        if (handlers.size) {
            return Array.from(handlers).every((handler) => handler(undefined));
        } else {
            return false;
        }
    }

    /** For forcing a refresh write if less than 2 renders after a resize event */
    private handleResizeCounter(opts: WriteOpts) {
        if (opts.resize) {
            this._sinceResize = 0;
        } else {
            ++this._sinceResize;
        }
    }
}
