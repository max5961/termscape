import { Compositor } from "../compositor/Compositor.js";
import { FriendDomElement } from "../dom/DomElement.js";
import { RenderHooks } from "./RenderHooks.js";
import { Performance } from "./Performance.js";
import { root } from "../dom/Root.js";
import { BEGIN_SYNCHRONIZED_UPDATE, END_SYNCHRONIZED_UPDATE } from "../constants.js";
import ansi from "ansi-escape-sequences";
import ansiescapes from "ansi-escapes";
import { Write } from "./Write.js";

// Compose classes:
// Write (handles tracking cursor position and overwriting changes)
// Performance (already implemented)
// RenderHooks (already implemented)
export class Renderer {
    private lastHeight: number;
    private lastStdout: string;
    private perf: Performance;
    public hooks: RenderHooks;
    private write: Write;

    constructor() {
        this.lastHeight = -1;
        this.lastStdout = "";
        this.perf = new Performance(false);
        this.hooks = new RenderHooks();
        this.write = new Write();

        process.stdout.on("resize", this.writeToStdout);

        // process.stdout.write(ansi.cursor.hide);
        const showCursor = () => process.stdout.write(ansi.cursor.show);
        process.on("beforeExit", () => showCursor());
        process.on("SIGINT", () => showCursor() && process.exit());
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

    public clearPrevRows = () => {
        if (this.lastHeight <= 0) return "";
        return ansiescapes.eraseLines(this.lastHeight);
    };
}
