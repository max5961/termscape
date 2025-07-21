import { Layout } from "./Layout.js";
import { FriendDomElement } from "../dom/DomElement.js";
import { Canvas } from "./Canvas.js";
import { Root } from "../dom/Root.js";

export class Renderer {
    private lastHeight: number;
    private lastStdout: string;
    private hooks: ((canvas: Canvas) => unknown)[];

    constructor() {
        this.lastHeight = -1;
        this.lastStdout = "";
        this.hooks = [];
        process.stdout.on("resize", () => {
            this.writeToStdout();
        });
    }

    public writeToStdout = () => {
        const layout = new Layout();
        layout.draw(Root.current as unknown as FriendDomElement);

        this.hooks.forEach((hook) => hook(layout.canvas));

        this.clearPrevRows();
        this.lastHeight = layout.getHeight();
        const stdout = layout.getStdout();

        if (stdout !== this.lastStdout) {
            process.stdout.write(stdout);
            this.lastStdout = stdout;
        }
    };

    public clearPrevRows = () => {
        if (this.lastHeight <= 0) return;
        // Send csi sequences
    };

    /**
     * Draw to the finalized root canvas before its written to stdout.
     * */
    public postLayoutHook = (cb: (canvas: Canvas) => unknown) => {
        this.hooks.push(cb);
    };
}
