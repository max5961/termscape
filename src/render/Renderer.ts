import type { Root } from "../dom/RootElement.js";
import type { WriteOpts } from "../Types.js";
import type { Grid } from "../compositor/Canvas.js";
import type { PerformanceData } from "./hooks/Hooks.js";
import { logger } from "../shared/Logger.js";
import { isFullscreen, objectKeys } from "../Util.js";
import { Compositor } from "../compositor/Compositor.js";
import { Cursor, DebugCursor } from "./Cursor.js";
import { DomRects } from "../compositor/DomRects.js";
import { Ansi } from "../shared/Ansi.js";
import { CellWriter } from "./writer/CellWriter.js";
import { RefreshWriter } from "./writer/RefreshWriter.js";
import { RowWriter } from "./writer/RowWriter.js";
import { Draw } from "../compositor/draw/Draw.js";

export class Renderer {
    private readonly root: Root;
    private readonly cursor: Cursor;
    private readonly cellWriter: CellWriter;
    private readonly refreshWriter: RefreshWriter;
    private readonly rowWriter: RowWriter;
    private rects: DomRects;
    private draw: Draw;
    private rendersSinceLastResize: number;
    private lastGrid: Grid | undefined;

    constructor(root: Root) {
        this.root = root;
        this.cursor =
            process.env.CURSOR_DEBUG === "true"
                ? new DebugCursor(root)
                : new Cursor(root);
        this.cellWriter = new CellWriter(this.cursor, root);
        this.rowWriter = new RowWriter(this.cursor, root);
        this.refreshWriter = new RefreshWriter(this.cursor, root);
        this.rects = new DomRects();
        this.draw = new Draw();
        this.rendersSinceLastResize = 0;
    }

    private get canvas() {
        return this.root._canvas;
    }

    public get layoutHeight() {
        return this.lastGrid?.length ?? 0;
    }

    public getRects() {
        return this.rects;
    }

    public renderTree(opts: WriteOpts) {
        this.lastGrid = this.canvas.copyGrid();
        this.updateResizeCounter(opts);

        const scomposite = performance.now();
        if (this.onlyStyleChange(opts)) {
            this.canvas.clearGrid();
        } else {
            this.draw = new Draw();
            this.rects = new DomRects();
            const compositor = new Compositor(this.root, opts, this.draw, this.rects);
            compositor.buildLayout();
        }

        this.draw.performOps();
        this.canvas.removeTrailingWhitespace();
        const ecomposite = performance.now();

        this.prepareCursorOps(opts, this.lastGrid, this.canvas.grid);
        this.executeCursorOps();

        logger.write(`layoutMs: ${ecomposite - scomposite}`);
    }

    private executeCursorOps() {
        const stdout = this.root.runtime.stdout;
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

        let strategy: PerformanceData["diffStrategy"] = "refresh";
        if (shouldRefresh || !lastGrid) {
            this.refreshWriter.instructCursor(lastGrid, nextGrid, opts.capturedOutput);
        } else {
            if (this.root.runtime.writeMode === "cell") {
                this.cellWriter.instructCursor(lastGrid, nextGrid);
                strategy = "cell";
            } else {
                this.rowWriter.instructCursor(lastGrid, nextGrid);
                strategy = "row";
            }

            this.refreshWriter.resetLastOutput();
        }

        this.cursor.moveToRow(nextGrid.length - 1);
        return strategy;
    }

    private onlyStyleChange(opts: WriteOpts): boolean {
        const keys = objectKeys(opts);
        if (keys.length <= 2 && opts.capturedOutput !== undefined && opts.styleChange) {
            return true;
        }
        return false;
    }

    private shouldRefreshWrite(opts: WriteOpts, nextGrid: Grid) {
        if (this.root.runtime.writeMode === "refresh") return true;
        if (!this.lastGrid) return true;
        if (opts.resize) return true;
        if (opts.screenChange) return true;
        if (opts.capturedOutput && !this.isFullscreen(nextGrid)) return true;
        if (this.rendersSinceLastResize < 2) return true;
        if (!this.termSupportsAnsiCursor()) return true;
        return false;
    }

    private isFullscreen(grid: Grid): boolean {
        return isFullscreen(grid, this.root.runtime.stdout);
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
        const handlers = this.root.hooks.getHookSet("block-render");
        if (handlers.size) {
            return Array.from(handlers).every((handler) => handler(undefined));
        } else {
            return false;
        }
    }

    /** For forcing a refresh write if less than 2 renders after a resize event */
    private updateResizeCounter(opts: WriteOpts) {
        if (opts.resize) {
            this.rendersSinceLastResize = 0;
        } else {
            ++this.rendersSinceLastResize;
        }
    }
}
