import { Compositor } from "../compositor/Compositor.js";
import { FriendDomElement } from "../dom/DomElement.js";
import { RenderHooks } from "./RenderHooks.js";
import { Performance } from "./Performance.js";
import { Cursor } from "./Cursor.js";
import { Canvas } from "../canvas/Canvas.js";
import { RefreshWriter } from "./write/RefreshWriter.js";
import { PreciseWriter } from "./write/PreciseWriter.js";
import { DomRects } from "../compositor/DomRects.js";
import { Ansi } from "../util/Ansi.js";
import { Root } from "../dom/Root.js";

export type WriteOpts = {
    resize?: boolean;
    capturedOutput?: string;
    screenChange?: boolean;
    skipCalculateLayout?: boolean;
};

export class Renderer {
    public lastCanvas: Canvas | null;
    public rects: DomRects;
    private perf: Performance;
    private cursor: Cursor;
    private preciseWriter: PreciseWriter;
    private refreshWriter: RefreshWriter;
    public hooks: RenderHooks;
    private lastWasResize: number;
    private root: Root;

    constructor(root: Root) {
        this.root = root;
        this.lastCanvas = null;
        this.rects = new DomRects();
        this.hooks = new RenderHooks();
        this.perf = new Performance(false);
        this.cursor = new Cursor({ debug: !!process.env["RENDER_DEBUG"] });
        this.preciseWriter = new PreciseWriter(this.cursor);
        this.refreshWriter = new RefreshWriter(this.cursor);
        this.lastWasResize = 0;
    }

    public writeToStdout = (opts: WriteOpts) => {
        if (this.hooks.renderIsBlocked) return;

        this.perf.tracking = !!this.hooks.renderPerf.size;

        // SHOULD HAVE A PRE & POST YOGA LAYOUT CALCULATION HERE AND PERFORM HERE RATHER THAN IN ROOT CLASS

        /**** PRE-LAYOUT ****/
        this.perf.preLayout();

        const compositor = new Compositor();
        compositor.buildLayout(this.root as unknown as FriendDomElement);

        this.hooks.postLayout.forEach((cb) => cb(compositor.canvas));

        process.stdout.write(Ansi.beginSynchronizedUpdate);

        if (this.shouldRefreshWrite(opts, compositor.canvas)) {
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
        } else {
            this.preciseWriter.instructCursor(this.lastCanvas!, compositor.canvas);
            this.refreshWriter.resetLastOutput();
        }

        this.cursor.moveToRow(compositor.canvas.grid.length - 1);
        /**** POST-LAYOUT ****/
        this.perf.postLayout();

        /**** PRE-WRITE ****/
        this.perf.preWrite();

        this.cursor.execute();

        if (this.termSupportsAnsiCursor() && opts.capturedOutput) {
            const lines = opts.capturedOutput.split("\n").length;
            this.cursor.rowsUp(lines);
            this.cursor.deferOutput(opts.capturedOutput, lines);
            this.cursor.execute();
        }

        process.stdout.write(Ansi.endSynchronizedUpdate);

        /**** POST-WRITE ****/
        this.perf.postWrite();
        if (this.perf.tracking) {
            this.hooks.renderPerf.forEach((cb) => {
                cb(this.perf.getPerf());
            });
        }

        this.lastCanvas = compositor.canvas;
        this.rects = compositor.rects;
    };

    private shouldRefreshWrite(opts: WriteOpts, _canvas: Canvas) {
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
        // write again to make sure goes where it should.
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
     * use the `PreciseWriter` strategy.
     */
    private termSupportsAnsiCursor(): boolean {
        const term = process.env["TERM"];
        return !!term?.match(/xterm|kitty|alacritty|ghostty/);
    }
}
