import type { CoreRootElement } from "../CoreRootElement.js";
import { Compositor } from "../compositor/Compositor.js";
import { Writer } from "./writer/Writer.js";

export class Renderer {
    private readonly root: CoreRootElement;
    private readonly compositor: Compositor;
    private readonly writer: Writer;
    private capturedOutput: string[];

    constructor(root: CoreRootElement) {
        this.root = root;
        this.compositor = new Compositor(root);
        this.writer = new Writer(root);
        this.capturedOutput = [];
    }

    public render = (bitmask: number) => {
        if (!this.root.runtime.isActive) return;

        const grid = this.compositor.compose(bitmask);
        const capturedOutput = this.getCapturedOutput();
        this.writer.write(grid, bitmask, capturedOutput);
    };

    public get domRects() {
        return this.compositor.getDomRects();
    }

    public pushCapturedOutput(data: string) {
        this.capturedOutput.push(data);
    }

    private getCapturedOutput() {
        const output = this.capturedOutput.join("");
        this.capturedOutput = [];
        return output;
    }
}

// public performPreRenderTasks(opts: Record<string, string>) {
//     if (opts.resize) {
//         // this will recalc all of the elements with viewport dimensions
//         this.root.notify("resize");
//     }
// }
