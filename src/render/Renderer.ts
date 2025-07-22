import { Layout } from "../layout/Layout.js";
import { FriendDomElement } from "../dom/DomElement.js";
import { RenderHooks } from "./RenderHooks.js";
import { Performance } from "./Performance.js";
import { root } from "../dom/Root.js";

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
    }

    public writeToStdout = () => {
        if (this.hooks.renderIsBlocked) return;

        this.perf.tracking = !!this.hooks.renderPerf.size;

        /**** PRE-LAYOUT ****/
        this.perf.preLayout();

        const layout = new Layout();
        layout.draw(root as unknown as FriendDomElement);

        /**** POST-LAYOUT ****/
        this.perf.postLayout();
        this.hooks.postLayout.forEach((cb) => cb(layout.canvas));

        this.clearPrevRows();
        this.lastHeight = layout.getHeight();

        /**** PRE-WRITE ****/
        this.perf.preWrite();
        const stdout = layout.getStdout();

        if (stdout !== this.lastStdout) {
            this.hooks.preWrite.forEach((cb) => cb(stdout));
            process.stdout.write(stdout);
            this.lastStdout = stdout;

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
        if (this.lastHeight <= 0) return;
        // Send csi sequences
    };
}
