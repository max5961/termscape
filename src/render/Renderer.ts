import { Compositor } from "../compositor/Compositor.js";
import { Cursor, DebugCursor } from "./Cursor.js";
import { Canvas } from "../compositor/Canvas.js";
import { WriterRefresh } from "./writer/WriterRefresh.js";
import { WriterPrecise } from "./writer/WriterPrecise.js";
import { DomRects } from "../compositor/DomRects.js";
import { Ansi } from "../shared/Ansi.js";
import type { Root } from "../dom/RootElement.js";
import type { WriteOpts } from "../Types.js";

export class Renderer {
    // CHORE - could underscore all of these properties and make the publics internal
    public lastCanvas: Canvas | null;
    public rects: DomRects;
    private cursor: Cursor;
    // CHORE - preciseWriter makes more sense as cellWriter (WriterCell)
    // This is more inline with the direction of wanting to have a rowWriter
    private preciseWriter: WriterPrecise;
    private refreshWriter: WriterRefresh;
    private lastWasResize: number;
    private root: Root;

    constructor(root: Root) {
        this.root = root;
        this.lastCanvas = null;
        this.rects = new DomRects();
        this.cursor = process.env["RENDER_DEBUG"]
            ? new DebugCursor(root)
            : new Cursor(root);
        this.preciseWriter = new WriterPrecise(this.cursor, this.root);
        this.refreshWriter = new WriterRefresh(this.cursor, this.root);
        this.lastWasResize = 0;
    }

    private renderIsBlocked() {
        const handlers = this.root.hooks.getHookSet("block-render");
        if (handlers.size) {
            return Array.from(handlers).every((handler) => handler(undefined));
        } else {
            return false;
        }
    }

    // CHORE - this function sucks and is doing too much.  At the same time,
    // it should be readable and jumping around too much is already a problem in
    // this class

    public writeToStdout = (opts: WriteOpts) => {
        if (this.renderIsBlocked()) return;

        this.root.hooks.exec("pre-layout", undefined);
        const preLayoutMs = performance.now();
        const compositor = this.getComposedLayout(opts);
        const postLayoutMs = performance.now();
        this.root.hooks.exec("post-layout", compositor.canvas);

        const lastCanvas = this.lastCanvas;
        const nextCanvas = compositor.canvas;

        this.root.hooks.exec("pre-write", { lastCanvas, nextCanvas });
        const preDiffMs = performance.now();
        const didRefreshWrite = this.deferWrite(compositor, opts);
        const postDiffMs = performance.now();
        this.performWrite();
        this.root.hooks.exec("post-write", { lastCanvas, nextCanvas });

        this.root.hooks.exec("performance", {
            layoutMs: postLayoutMs - preLayoutMs,
            diffMs: postDiffMs - preDiffMs,
            diffStrategy: didRefreshWrite ? "refresh" : "precise",
        });
    };

    private getComposedLayout(opts: WriteOpts) {
        const initialCompositor = this.constructCompositor(opts);
        const nextCompositor = this.handlePostLayoutSideEffects(initialCompositor);
        return nextCompositor;
    }

    private constructCompositor(opts: WriteOpts) {
        const compositor = new Compositor(this.root);
        compositor.buildLayout(this.root, !!opts.layoutChange);
        return compositor;
    }

    private handlePostLayoutSideEffects(compositor: Compositor): Compositor {
        const recompose = (cb: () => boolean) => {
            if (cb()) {
                compositor = this.constructCompositor({ layoutChange: true });
            }
        };

        // Order Matters: CB -> Yoga -> Recompose
        const withYoga = (cb: () => boolean) => {
            recompose(() => {
                const result = cb();
                if (result) this.root._calculateYogaLayout();
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

    private deferWrite(compositor: Compositor, opts: WriteOpts) {
        let didRefreshWrite = true;
        if (this.shouldRefreshWrite(opts)) {
            this.refreshWrite(compositor, opts);
        } else {
            didRefreshWrite = false;
            this.preciseWriter.instructCursor(this.lastCanvas!, compositor.canvas);
            this.refreshWriter.resetLastOutput();
        }

        this.cursor.moveToRow(compositor.canvas.grid.length - 1);
        this.lastCanvas = compositor.canvas;
        this.rects = compositor.rects;
        return didRefreshWrite;
    }

    private performWrite() {
        this.root.runtime.stdout.write(Ansi.beginSynchronizedUpdate);
        this.cursor.execute();
        this.root.runtime.stdout.write(Ansi.endSynchronizedUpdate);
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

    // CHORE - this should be revisited.  Perhaps a jsdoc comment instead of
    // comments in the function body

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
