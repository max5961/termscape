import type { Point, StdoutLike } from "../../Types.js";
import type { CoreElement } from "../CoreElement.js";
import { Canvas } from "./Canvas.js";
import type { RootCanvas } from "./RootCanvas.js";
import type { Grid, PenLimits } from "./types.js";

export class SubCanvas extends Canvas {
    public readonly root: RootCanvas;
    public override readonly core: CoreElement;

    // set in constrainToLayout
    public override corner!: Point;
    public override limits!: PenLimits;
    public override ygHeight!: number;
    public override ygWidth!: number;

    public override get grid(): Grid {
        return this.root.grid;
    }

    public override get stdout(): StdoutLike {
        return this.root.stdout;
    }

    constructor(root: RootCanvas, core: CoreElement, parent: Canvas) {
        super();
        this.root = root;
        this.core = core;
        this.constrainToLayout(parent);
    }

    public constrainToLayout(parent: Canvas) {
        this.resetRects();
        this.ygHeight = this.getYgHeight();
        this.ygWidth = this.getYgWidth();
        this.corner = this.getCorner(parent);
        this.limits = this.getPenLimits(parent);
        this.forceGridToAccomodate();
    }

    private getYgHeight() {
        // return this.core._is(TEXT_ELEMENT)
        //     ? this.core._textHeight
        //     : this.core.yogaNode.getComputedHeight();
        return this.core.yogaNode.getComputedHeight();
    }

    private getYgWidth() {
        // return this.core._is(TEXT_ELEMENT)
        //     ? Math.max(
        //           this.core.textContent.length,
        //           this.core.yogaNode.getComputedWidth(),
        //       )
        //     : this.core.yogaNode.getComputedWidth();
        return this.core.yogaNode.getComputedWidth();
    }

    private getCorner(parent: Canvas) {
        const ygXoff = this.core.yogaNode.getComputedLeft();
        const ygYoff = this.core.yogaNode.getComputedTop();

        // const pscrollX = parent.core._scrollService.scrollOffset.x;
        // const pscrollY = parent.core._scrollService.scrollOffset.y;

        return {
            // x: parent.corner.x + ygXoff + pscrollX,
            // y: parent.corner.y + ygYoff + pscrollY,
            x: parent.corner.x + ygXoff,
            y: parent.corner.y + ygYoff,
        };
    }

    private getPenLimits(parent: Canvas) {
        const limits = { ...parent.limits };
        const xOverFlow = this.core.shadow.overflowX === "hidden";
        const yOverflow = this.core.shadow.overflowY === "hidden";

        if (xOverFlow || yOverflow) {
            const pVis = parent.visContentRect;
            if (xOverFlow) {
                limits.minX = pVis.corner.x;
                limits.maxX = pVis.corner.x + pVis.width;
            }
            if (yOverflow) {
                limits.minY = pVis.corner.y;
                limits.maxY = pVis.corner.y + pVis.height;
            }
        }

        return limits;
    }
}
