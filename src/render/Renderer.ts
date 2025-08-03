import { Compositor } from "../compositor/Compositor.js";
import { FriendDomElement } from "../dom/DomElement.js";
import { RenderHooks } from "./RenderHooks.js";
import { Performance } from "./Performance.js";
import { root } from "../dom/Root.js";
import { BEGIN_SYNCHRONIZED_UPDATE, END_SYNCHRONIZED_UPDATE } from "../constants.js";
import { Cursor } from "./Cursor.js";
import { Canvas } from "../canvas/Canvas.js";
import { RefreshWriter } from "./write/RefreshWriter.js";
import { PreciseWriter } from "./write/PreciseWriter.js";
import { DomRects } from "../compositor/DomRects.js";

export type WriteOpts = {
    resize: boolean;
    capturedOutput?: string;
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

    constructor() {
        this.lastCanvas = null;
        this.rects = new DomRects();
        this.hooks = new RenderHooks();
        this.perf = new Performance(false);
        this.cursor = new Cursor({ debug: !!process.env.RENDER_DEBUG });
        this.preciseWriter = new PreciseWriter(this.cursor);
        this.refreshWriter = new RefreshWriter(this.cursor);
        this.lastWasResize = 0;

        this.cursor.show(false);
        process.on("beforeExit", () => this.cursor.show(true));
        process.on("SIGINT", () => {
            this.cursor.show(true);
            process.exit();
        });
    }

    public writeToStdout = (opts: WriteOpts) => {
        if (this.hooks.renderIsBlocked) return;

        this.perf.tracking = !!this.hooks.renderPerf.size;

        /**** PRE-LAYOUT ****/
        this.perf.preLayout();

        const compositor = new Compositor();
        compositor.buildLayout(root as unknown as FriendDomElement);

        this.hooks.postLayout.forEach((cb) => cb(compositor.canvas));

        process.stdout.write(BEGIN_SYNCHRONIZED_UPDATE);

        // Cases that should require a full rewrite are
        // - possible unsupported terminal
        // - hasCapturedOutput
        // - rows > stdout rows
        // - resize
        // - first write
        if (
            !this.lastCanvas ||
            opts.resize ||
            this.lastWasResize ||
            opts.capturedOutput
        ) {
            this.refreshWriter.instructCursor(
                this.lastCanvas,
                compositor.canvas,
                opts.capturedOutput,
            );
            if (opts.resize) {
                this.lastWasResize = 1;
            }
            if (this.lastWasResize) {
                if (++this.lastWasResize > 3) {
                    this.lastWasResize = 0;
                }
            }
        } else {
            this.preciseWriter.instructCursor(this.lastCanvas, compositor.canvas);
            this.refreshWriter.resetLastOutput();
        }

        this.cursor.moveToRow(compositor.canvas.grid.length - 1);
        /**** POST-LAYOUT ****/
        this.perf.postLayout();

        /**** PRE-WRITE ****/
        this.perf.preWrite();

        this.cursor.execute();

        process.stdout.write(END_SYNCHRONIZED_UPDATE);

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
}
