import { Yg } from "../../Constants.js";
import { SubCanvas } from "../canvas/SubCanvas.js";
import { Draw } from "./Draw.js";
import type { Canvas } from "../canvas/Canvas.js";
import type { RootCanvas } from "../canvas/RootCanvas.js";
import type { Grid } from "../canvas/types.js";
import type { CoreRootElement } from "../CoreRootElement.js";
import { StateChange } from "../renderer/RenderStateChange.js";

export class Compositor {
    private readonly root: CoreRootElement;
    private readonly canvas: RootCanvas;
    private readonly draw: Draw;
    private hasComposed: boolean;

    constructor(root: CoreRootElement) {
        this.root = root;
        this.canvas = root.canvas;
        this.draw = new Draw();
        this.hasComposed = false;
    }

    public compose(bitmask: StateChange): Readonly<Grid> {
        this.getComposedGrid(bitmask);
        this.canvas.removeTrailingWhitespace();
        return this.canvas.grid;
    }

    private getComposedGrid(bitmask: StateChange): Grid {
        bitmask = this.stripRendererSpecificFlags(bitmask);
        bitmask = this.resolveLayoutChangeFlag(bitmask);

        if (this.styleChange(bitmask)) {
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

    /**
     * Removes Resize and Screen flags so that the we can rely on strict equality
     * checking the flags.  For example, a style change should only be composited
     * as a style change if no other flags are present.
     * */
    private stripRendererSpecificFlags(bitmask: number) {
        bitmask &= ~StateChange.Resize;
        bitmask &= ~StateChange.Screen;
        return bitmask;
    }

    private resolveLayoutChangeFlag(bitmask: number) {
        if (!this.hasComposed) {
            this.hasComposed = true;
            bitmask |= StateChange.Layout;
        }
        return bitmask;
    }

    private styleChange(bitmask: number) {
        return !bitmask || bitmask === StateChange.Style;
    }

    private scrollChange(bitmask: number) {
        return (
            bitmask === StateChange.Scroll ||
            bitmask === (StateChange.Scroll | StateChange.Style)
        );
    }

    private zIndexChange(bitmask: number) {
        return (
            bitmask === StateChange.ZIndex ||
            bitmask === (StateChange.ZIndex | StateChange.Style)
        );
    }
}
