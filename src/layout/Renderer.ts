import { Layout } from "./Layout.js";
import { DomElement, FriendDomElement } from "../dom/DomElement.js";
import { Canvas } from "./Canvas.js";

export class Renderer {
    private layout: Layout;
    private lastHeight: number;
    private lastStdout: string;
    private hooks: ((canvas: Canvas) => unknown)[];
    private root: FriendDomElement;

    constructor(root: DomElement) {
        this.root = root as unknown as FriendDomElement;
        this.layout = new Layout();
        this.lastHeight = -1;
        this.lastStdout = "";
        this.hooks = [];
        process.stdout.on("resize", () => {
            this.writeToStdout();
        });
    }

    public writeToStdout() {
        this.layout = new Layout();
        this.layout.renderNode(this.root, this.layout.canvas, true);

        this.hooks.forEach((hook) => hook(this.layout.canvas));

        this.clearPrevRows();
        this.lastHeight = this.layout.getHeight();
        const stdout = this.layout.getStdout();

        if (stdout !== this.lastStdout) {
            process.stdout.write(stdout);
            this.lastStdout = stdout;
        }
    }

    public clearPrevRows() {
        if (this.lastHeight <= 0) return;
        // Send csi sequences
    }

    /**
     * Draw to the finalized root canvas before its written to stdout.
     * */
    public postLayoutHook(cb: (canvas: Canvas) => unknown) {
        this.hooks.push(cb);
    }
}
