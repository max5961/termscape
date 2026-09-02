import type { Grid } from "../canvas/types.js";
import { Compositor } from "../compositor/Compositor.js";
import { StateChange } from "../renderer/RenderStateChange.js";
import type { CoreRootElement } from "../CoreRootElement.js";

export class Renderer {
    private readonly root: CoreRootElement;
    private readonly compositor: Compositor;
    private lastGrid: Readonly<Grid> | undefined;
    private nextGrid: Readonly<Grid> | undefined;
    private rendersSinceLastResize: number;
    private capturedOutput: string[];

    constructor(root: CoreRootElement) {
        this.root = root;
        this.compositor = new Compositor(root);
        this.rendersSinceLastResize = Infinity;
        this.capturedOutput = [];
    }

    public render = (bitmask: number) => {
        this.handleResizeCounter(bitmask);
        this.lastGrid = this.nextGrid;
        this.nextGrid = this.compositor.compose(bitmask);

        const output = this.getCapturedOutput();
        const shouldRefreshWrite = this.shouldRefreshWrite(bitmask, output);
    };

    public get domRects() {
        return this.compositor.getDomRects();
    }

    private shouldRefreshWrite(bitmask: number, capturedOutput: string) {
        if (this.root.runtimeControl.writeMode === "refresh") return true;
        if (bitmask & StateChange.Resize) return true;
        if (bitmask & StateChange.Screen) return true;
        if (capturedOutput.length) return true;

        return false;
    }

    public pushCapturedOutput(data: string) {
        this.capturedOutput.push(data);
    }

    private getCapturedOutput() {
        const output = this.capturedOutput.join("");
        this.capturedOutput = [];
        return output;
    }

    private handleResizeCounter(bitmask: number) {
        if (bitmask & StateChange.Resize) {
            this.rendersSinceLastResize = -1;
        }
        ++this.rendersSinceLastResize;
    }
}

// public performPreRenderTasks(opts: Record<string, string>) {
//     if (opts.resize) {
//         // this will recalc all of the elements with viewport dimensions
//         this.root.notify("resize");
//     }
// }
