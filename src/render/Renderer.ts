import { Compositor } from "../compositor/Compositor.js";
import { Cursor, DebugCursor } from "./Cursor.js";
import { WriterRefresh } from "./writer/WriterRefresh.js";
import { WriterCell } from "./writer/WriterCell.js";
import type { Root } from "../dom/RootElement.js";
import type { WriteOpts } from "../Types.js";
import { objectKeys } from "../Util.js";
import type { Grid } from "../compositor/Canvas.js";
import { DomRects } from "../compositor/DomRects.js";
import { Ansi } from "../shared/Ansi.js";
import { logger } from "../shared/Logger.js";

export class Renderer {
    private readonly host: Root;
    private readonly cursor: Cursor;
    private readonly cellWriter: WriterCell;
    private readonly refreshWriter: WriterRefresh;
    private sinceResize: number;
    private lastCompositor: Compositor | undefined;
    public lastGrid: Grid | undefined;
    public rects: DomRects;

    constructor(host: Root) {
        this.host = host;
        this.cursor = process.env["RENDER_DEBUG"]
            ? new DebugCursor(host)
            : new Cursor(host);
        this.cellWriter = new WriterCell(this.cursor, this.host);
        this.refreshWriter = new WriterRefresh(this.cursor, this.host);
        this.lastGrid = undefined;
        this.lastCompositor = undefined;
        this.rects = new DomRects();
        this.sinceResize = 0;
    }

    public renderTree(opts: WriteOpts) {
        if (this.checkIfBlockedRender()) return;
        this.handleResizeCounter(opts);

        // Create layout/grid
        this.host.hooks.exec("pre-layout", undefined);
        const [layoutMs, compositor] = this.wrapPerf(() => this.getComposedLayout(opts));
        this.host.hooks.exec("post-layout", compositor.canvas);

        const lastGrid = this.lastGrid;
        const nextGrid = compositor.canvas.grid;
        this.lastCompositor = compositor;
        this.lastGrid = nextGrid;
        this.rects = compositor.rects;

        // Load cursor with operations and execute
        this.host.hooks.exec("pre-write", undefined);
        const [diffMs, didRefreshWrite] = this.wrapPerf(() => {
            return this.prepareCursorOps(opts, lastGrid, nextGrid);
        });
        this.executeCursorOps();
        this.host.hooks.exec("post-write", undefined);

        this.host.hooks.exec("performance", {
            layoutMs,
            diffMs,
            diffStrategy: didRefreshWrite ? "refresh" : "precise",
        });
    }

    private wrapPerf<T>(cb: () => T): [number, T] {
        const start = performance.now();
        const result = cb();
        const end = performance.now();
        return [end - start, result];
    }

    private executeCursorOps() {
        const stdout = this.host.runtime.stdout;
        stdout.write(Ansi.beginSynchronizedUpdate);
        this.cursor.execute();
        stdout.write(Ansi.endSynchronizedUpdate);
    }

    private prepareCursorOps(
        opts: WriteOpts,
        lastGrid: Grid | undefined,
        nextGrid: Grid,
    ) {
        const shouldRefresh = this.shouldRefreshWrite(opts, nextGrid);
        if (shouldRefresh || !lastGrid) {
            this.refreshWriter.instructCursor(lastGrid, nextGrid, opts.capturedOutput);
        } else {
            this.cellWriter.instructCursor(lastGrid, nextGrid);
            this.refreshWriter.resetLastOutput();
        }

        this.cursor.moveToRow(nextGrid.length - 1);
        return shouldRefresh;
    }

    private getComposedLayout(opts: WriteOpts): Compositor {
        let compositor: Compositor;
        if (this.onlyStyleChange(opts) && this.lastCompositor) {
            compositor = this.redrawLastGrid(this.lastCompositor);
        } else {
            compositor = this.composeNewLayout(opts);
        }
        return this.handlePostLayoutSideEffects(compositor);
    }

    private composeNewLayout(opts: WriteOpts): Compositor {
        const compositor = new Compositor(this.host, opts);
        compositor.buildLayout(this.host);
        return compositor;
    }

    private redrawLastGrid(compositor: Compositor) {
        this.lastGrid = compositor.canvas.grid.map((row) => row.slice());

        compositor.canvas.grid.splice(0);
        this.lastGrid.forEach((row) => {
            const nextRow = Array.from({ length: row.length }).fill(" ") as string[];
            compositor.canvas.grid.push(nextRow);
        });

        compositor.ops.performAll();
        return compositor;
    }

    private onlyStyleChange(opts: WriteOpts): boolean {
        const keys = objectKeys(opts);
        if (keys.length <= 2 && opts.capturedOutput !== undefined && opts.styleChange) {
            return true;
        }
        return false;
    }

    private handlePostLayoutSideEffects(compositor: Compositor): Compositor {
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
                if (result) this.host._calculateYogaLayout();
                return result;
            });
        };

        // scrollManagers and focusManagers do nothing more than normalize corner
        // offsets, so they do not effect Yoga.  afterLayout callbacks are a public
        // interface, so we recalculate Yoga to be safe.
        const sorted = compositor.PLM.getSorted();
        sorted.scrollManagers.forEach(recompose);
        sorted.focusManagers.forEach(recompose);
        sorted.afterLayout.forEach(withYoga);

        return compositor;
    }

    private shouldRefreshWrite(opts: WriteOpts, nextGrid: Grid) {
        if (!this.host.runtime.cellWrite) return true;
        if (!this.lastCompositor) return true;
        if (opts.resize) return true;
        if (opts.screenChange) return true;
        if (opts.capturedOutput && !this.isFullscreen(nextGrid)) return true;
        if (this.sinceResize < 2) return true;
        if (!this.termSupportsAnsiCursor()) return true;
        return false;
    }

    private isFullscreen(grid: Grid): boolean {
        const maxRows = this.host.runtime.stdout.rows;
        return maxRows <= grid.length;
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
        const handlers = this.host.hooks.getHookSet("block-render");
        if (handlers.size) {
            return Array.from(handlers).every((handler) => handler(undefined));
        } else {
            return false;
        }
    }

    /** For forcing a refresh write if less than 2 renders after a resize event */
    private handleResizeCounter(opts: WriteOpts) {
        if (opts.resize) {
            this.sinceResize = 0;
        } else {
            ++this.sinceResize;
        }
    }
}
