import { Yg } from "../../Constants.js";
import { SubCanvas } from "../canvas/SubCanvas.js";
import { Draw } from "./Draw.js";
import type { Canvas } from "../canvas/Canvas.js";
import type { RootCanvas } from "../canvas/RootCanvas.js";
import type { Grid } from "../canvas/types.js";
import type { CoreRootElement } from "../CoreRootElement.js";

export class Compositor {
    private readonly root: CoreRootElement;
    private readonly canvas: RootCanvas;
    private readonly draw: Draw;

    constructor(root: CoreRootElement) {
        this.root = root;
        this.canvas = root.canvas;
        this.draw = new Draw();
    }

    public compose(opts: { layoutChange: boolean }): Readonly<Grid> {
        if (!opts.layoutChange) {
            this.canvas.clearGrid();
            this.draw.performDrawOps();
            return this.canvas.grid;
        }

        this.calculateYogaLayout();
        this.canvas.resetGrid();
        this.draw.reset();
        this.build();
        this.draw.performDrawOps();
        return this.canvas.grid;
    }

    public getDomRects() {
        //
    }

    private calculateYogaLayout() {
        const width = this.root.stdout.columns;
        const height = undefined;
        const direction = Yg.DIRECTION_LTR;
        this.root.yogaNode.calculateLayout(width, height, direction);
    }

    private build(canvas: Canvas = this.canvas, relZIndex = 0) {
        const core = canvas.core;
        if (core.shadow.display === "none") return;

        const zIndex = relZIndex + core.shadow.zIndex;
        if (canvas.canDraw()) {
            this.draw.enqueue(zIndex, core, canvas);
        }

        for (let i = 0; i < core.treeNode.children.length; ++i) {
            const child = core.treeNode.children[i];
            if (!child.canvas) {
                child.canvas = new SubCanvas(this.canvas, child, canvas);
            } else if (child.canvas instanceof SubCanvas) {
                child.canvas.constrainToLayout(canvas);
            }

            this.build(child.canvas, zIndex);
        }
    }
}
