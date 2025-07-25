import { Compositor } from "../compositor/Compositor.js";
import { FriendDomElement } from "../dom/DomElement.js";
import { RenderHooks } from "./RenderHooks.js";
import { Performance } from "./Performance.js";
import { root } from "../dom/Root.js";
import ansi from "ansi-escapes";
import { BEGIN_SYNCHRONIZED_UPDATE, END_SYNCHRONIZED_UPDATE } from "../constants.js";

// Compose classes:
// Write (handles tracking cursor position and overwriting changes)
// Performance (already implemented)
// RenderHooks (already implemented)
export class Renderer {
    private lastHeight: number;
    private lastStdout: string;
    private perf: Performance;
    public hooks: RenderHooks;

    constructor() {
        this.lastHeight = -1;
        this.lastStdout = "";
        this.perf = new Performance(false);
        this.hooks = new RenderHooks();

        process.stdout.on("resize", this.writeToStdout);
        process.stdout.write(ansi.cursorHide);

        process.on("beforeExit", () => process.stdout.write(ansi.cursorShow));
    }

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
        return ansi.eraseLines(this.lastHeight);
    };
}
