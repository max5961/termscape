import { Compositor } from "../compositor/Compositor.js";
import { FriendDomElement } from "../dom/DomElement.js";
import { RenderHooks } from "./RenderHooks.js";
import { Performance } from "./Performance.js";
import { root } from "../dom/Root.js";
import { BEGIN_SYNCHRONIZED_UPDATE, END_SYNCHRONIZED_UPDATE } from "../constants.js";
import { Cursor } from "./Cursor.js";
import { Canvas } from "../canvas/Canvas.js";

// Composed Classes:
// - WritePrecise
// - WriteAll
// - Performance
// - RenderHooks
export class Renderer {
    private lastCanvas: Canvas | null;
    private perf: Performance;
    private cursor: Cursor;
    public hooks: RenderHooks;

    constructor() {
        this.lastCanvas = null;
        this.perf = new Performance(false);
        this.hooks = new RenderHooks();
        this.cursor = new Cursor({ debug: false });

        // this.cursor.show(false);
        process.on("beforeExit", () => this.cursor.show(true));
        process.on("SIGINT", () => this.cursor.show(true));

        // Re-render on resize
        process.stdout.on("resize", this.writeToStdout);
    }

    public writePrecise = () => {
        const layout = new Compositor();
        layout.composeTree(root as unknown as FriendDomElement);

        this.write.writeToStdout(layout.canvas.getStringCanvas());
    };

    public writeToStdout = () => {
        if (this.hooks.renderIsBlocked) return;

        this.perf.tracking = !!this.hooks.renderPerf.size;

        /**** PRE-LAYOUT ****/
        this.perf.preLayout();

        const layout = new Compositor();
        layout.composeTree(root as unknown as FriendDomElement);

        /**** POST-LAYOUT ****/
        this.perf.postLayout();
        this.hooks.postLayout.forEach((cb) => cb(layout.canvas));

        /**** PRE-WRITE ****/
        this.perf.preWrite();
        const stdout = layout.getStdout();

        if (stdout !== this.lastStdout) {
            this.hooks.preWrite.forEach((cb) => cb(stdout));
            process.stdout.write(BEGIN_SYNCHRONIZED_UPDATE);
            process.stdout.write(this.clearPrevRows() + stdout);
            process.stdout.write(END_SYNCHRONIZED_UPDATE);
            this.lastStdout = stdout;
            this.lastHeight = layout.getHeight();

            /**** POST-WRITE ****/
            this.perf.postWrite();

            if (this.perf.tracking) {
                this.hooks.renderPerf.forEach((cb) => {
                    cb(this.perf.getPerf());
                });
            }
        }
    };
}
