import { Compositor } from "../compositor/Compositor.js";
import { RenderHooks } from "./RenderHooks.js";
import { Performance } from "./Performance.js";
import { Cursor, DebugCursor } from "./Cursor.js";
import { Canvas } from "../compositor/Canvas.js";
import { WriterRefresh } from "./WriterRefresh.js";
import { WriterPrecise } from "./WriterPrecise.js";
import { DomRects } from "../compositor/DomRects.js";
import { Ansi } from "../shared/Ansi.js";
import { Root } from "../dom/Root.js";
import type { WriteOpts } from "../Types.js";
import { logger } from "../shared/Logger.js";

export class Renderer {
    public lastCanvas: Canvas | null;
    public rects: DomRects;
    private perf: Performance;
    private cursor: Cursor;
    private preciseWriter: WriterPrecise;
    private refreshWriter: WriterRefresh;
    public hooks: RenderHooks;
    private lastWasResize: number;
    private root: Root;

    constructor(root: Root) {
        this.root = root;
        this.lastCanvas = null;
        this.rects = new DomRects();
        this.hooks = new RenderHooks();
        this.perf = new Performance(false);
        this.cursor = process.env["RENDER_DEBUG"]
            ? new DebugCursor(root)
            : new Cursor(root);
        this.preciseWriter = new WriterPrecise(this.cursor);
        this.refreshWriter = new WriterRefresh(this.cursor);
        this.lastWasResize = 0;
    }

    public writeToStdout = (opts: WriteOpts) => {
        if (this.hooks.renderIsBlocked) return;

        this.preLayoutHooks();
        const compositor = this.getComposedLayout(opts);
        this.postLayoutHooks(compositor);

        this.deferWrite(compositor, opts);
        this.preWriteHooks();
        this.performWrite();
        this.postWriteHooks();
    };

    private getComposedLayout(opts: WriteOpts): Compositor {
        const compositor = new Compositor(this.root);
        compositor.buildLayout(this.root, !!opts.layoutChange);
        return compositor;
    }

    private deferWrite(compositor: Compositor, opts: WriteOpts) {
        if (this.shouldRefreshWrite(opts)) {
            this.refreshWrite(compositor, opts);
        } else {
            this.preciseWriter.instructCursor(this.lastCanvas!, compositor.canvas);
            this.refreshWriter.resetLastOutput();
        }

        this.cursor.moveToRow(compositor.canvas.grid.length - 1);
        this.lastCanvas = compositor.canvas;
        this.rects = compositor.rects;
    }

    private performWrite() {
        process.stdout.write(Ansi.beginSynchronizedUpdate);
        this.cursor.execute();
        //
        process.stdout.write(Ansi.endSynchronizedUpdate);
    }

    private refreshWrite(compositor: Compositor, opts: WriteOpts) {
        if (opts.resize) {
            this.cursor.clearRowsBelow();
        }

        this.refreshWriter.instructCursor(
            this.lastCanvas,
            compositor.canvas,
            opts.capturedOutput,
        );

        if (opts.resize) {
            this.lastWasResize = 1;
        }

        if (this.lastWasResize && ++this.lastWasResize > 3) {
            this.lastWasResize = 0;
        }
    }

    // =========================================================================
    // Render Hooks
    // =========================================================================

    private preLayoutHooks() {
        this.perf.tracking = !!this.hooks.renderPerf.size;
        this.perf.preLayout();
    }

    private postLayoutHooks(compositor: Compositor) {
        this.perf.postLayout();
        this.hooks.postLayout.forEach((cb) => cb(compositor.canvas));
    }

    private preWriteHooks() {
        this.perf.preWrite();
    }

    private postWriteHooks() {
        this.perf.postWrite();
        if (this.perf.tracking) {
            this.hooks.renderPerf.forEach((cb) => {
                cb(this.perf.getPerf());
            });
        }
    }

    // =========================================================================
    // Util
    // =========================================================================

    private shouldRefreshWrite(opts: WriteOpts) {
        // Refresh option set in runtime opts
        if (!this.root.runtime.preciseWrite) {
            return true;
        }

        // First write
        if (!this.lastCanvas) {
            return true;
        }

        // Resize
        if (opts.resize) {
            return true;
        }

        // Enter/Exit alt screen
        if (opts.screenChange) {
            return true;
        }

        // Resizes are messy and make tracking the cursor row difficult, so refresh
        // write again to make sure the cursor goes where it should.
        if (this.lastWasResize) {
            return true;
        }

        // `console` statements should be printed above output, or overlayed on top of
        // output if fullscreen
        if (opts.capturedOutput) {
            return true;
        }

        if (!this.termSupportsAnsiCursor()) {
            return true;
        }

        return false;
    }

    /**
     * Greenlight only terminals that *definitely* support ansi cursor control to
     * use the `WriterPrecise` strategy.
     */
    private termSupportsAnsiCursor(): boolean {
        const term = process.env["TERM"];
        return !!term?.match(/xterm|kitty|alacritty|ghostty/);
    }
}
