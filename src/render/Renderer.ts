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

export class Renderer {
    private lastCanvas: Canvas | null;
    private perf: Performance;
    private cursor: Cursor;
    private preciseWriter: PreciseWriter;
    private refreshWriter: RefreshWriter;
    public hooks: RenderHooks;

    constructor() {
        this.lastCanvas = null;
        this.hooks = new RenderHooks();
        this.perf = new Performance(false);
        this.cursor = new Cursor({ debug: !!process.env.RENDER_DEBUG });
        this.preciseWriter = new PreciseWriter(this.cursor);
        this.refreshWriter = new RefreshWriter(this.cursor);

        // this.cursor.show(false);
        process.on("beforeExit", () => this.cursor.show(true));
        process.on("SIGINT", () => {
            this.cursor.show(true);
            process.exit();
        });

        // Re-render on resize
        process.stdout.on("resize", this.writeToStdout);
    }

    public writeToStdout = () => {
        const compositor = new Compositor();
        compositor.composeTree(root as unknown as FriendDomElement);

        process.stdout.write(BEGIN_SYNCHRONIZED_UPDATE);

        // Add cases here such as `unsupported terminal` or `hasCapturedOutput`
        if (!this.lastCanvas) {
            this.refreshWriter.writeToStdout(this.lastCanvas, compositor.canvas);
        } else {
            this.preciseWriter.writeToStdout(this.lastCanvas, compositor.canvas);
            this.refreshWriter.resetLastOutput();
        }

        process.stdout.write(END_SYNCHRONIZED_UPDATE);

        this.lastCanvas = compositor.canvas;
    };

    // public writeToStdout = () => {
    //     if (this.hooks.renderIsBlocked) return;
    //
    //     this.perf.tracking = !!this.hooks.renderPerf.size;
    //
    //     /**** PRE-LAYOUT ****/
    //     this.perf.preLayout();
    //
    //     const layout = new Compositor();
    //     layout.composeTree(root as unknown as FriendDomElement);
    //
    //     /**** POST-LAYOUT ****/
    //     this.perf.postLayout();
    //     this.hooks.postLayout.forEach((cb) => cb(layout.canvas));
    //
    //     /**** PRE-WRITE ****/
    //     this.perf.preWrite();
    //     const stdout = layout.getStdout();
    //
    //     if (stdout !== this.lastStdout) {
    //         this.hooks.preWrite.forEach((cb) => cb(stdout));
    //         process.stdout.write(BEGIN_SYNCHRONIZED_UPDATE);
    //         process.stdout.write(this.clearPrevRows() + stdout);
    //         process.stdout.write(END_SYNCHRONIZED_UPDATE);
    //         this.lastStdout = stdout;
    //         this.lastHeight = layout.getHeight();
    //
    //         /**** POST-WRITE ****/
    //         this.perf.postWrite();
    //
    //         if (this.perf.tracking) {
    //             this.hooks.renderPerf.forEach((cb) => {
    //                 cb(this.perf.getPerf());
    //             });
    //         }
    //     }
    // };
}
