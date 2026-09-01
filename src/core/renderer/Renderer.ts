import type { Grid } from "../canvas/types.js";
import { Compositor } from "../compositor/Compositor.js";
import type { CoreRootElement } from "../CoreRootElement.js";

export class Renderer {
    private readonly compositor: Compositor;
    private lastGrid: Readonly<Grid> | undefined;
    private nextGrid: Readonly<Grid> | undefined;

    constructor(root: CoreRootElement) {
        this.compositor = new Compositor(root);
    }

    public render() {
        this.lastGrid = this.nextGrid;
        this.nextGrid = this.compositor.compose({
            layoutChange: !this.lastGrid || true,
        });
    }

    public get domRects() {
        return this.compositor.getDomRects();
    }

    public shouldRefreshWrite() {
        if (!this.lastGrid) return true;
    }
}

// public performPreRenderTasks(opts: Record<string, string>) {
//     if (opts.resize) {
//         // this will recalc all of the elements with viewport dimensions
//         this.root.notify("resize");
//     }
// }
