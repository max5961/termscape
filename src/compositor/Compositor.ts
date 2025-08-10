import { DOM_ELEMENT_R_STYLE, DomElement } from "../dom/DomElement.js";
import { Canvas } from "../canvas/Canvas.js";
import { Operations } from "./Operations.js";
import { DomRects } from "./DomRects.js";
import { Draw } from "./Draw.js";

export class Compositor {
    public canvas: Canvas;
    public ops: Operations;
    public rects: DomRects;
    public draw: Draw;

    constructor() {
        this.canvas = new Canvas();
        this.ops = new Operations();
        this.rects = new DomRects();
        this.draw = new Draw();
    }

    public buildLayout(elem: DomElement, canvas: Canvas = this.canvas) {
        if (elem.style.display === "none") return;

        const style = elem[DOM_ELEMENT_R_STYLE];
        const zIndex = style.zIndex ?? 0;

        this.draw.updateLowestLayer(zIndex);
        this.rects.setRect(elem, canvas);
        this.rects.storeElementPosition(zIndex, elem);

        if (elem.tagName === "BOX_ELEMENT") {
            this.ops.defer(zIndex, () => this.draw.composeBox(elem, style, canvas));
        }

        for (const child of elem.children) {
            const childCanvas = this.getChildCanvas(elem, canvas, child);
            this.buildLayout(child, childCanvas);
        }

        if (elem.tagName === "ROOT_ELEMENT") {
            this.ops.performAll();
        }
    }

    private getChildCanvas(
        parent: DomElement,
        parentCanvas: Canvas,
        child: DomElement,
    ): Canvas {
        let width = child.node.getComputedWidth();
        let height = child.node.getComputedHeight();
        const xoff = parentCanvas.corner.x + child.node.getComputedTop();
        const yoff = parentCanvas.corner.y + child.node.getComputedLeft();

        const hideOverflow = parent.style.overflow === "hidden";
        const xHideOverflow = parent.style.overflowX === "hidden";
        const yHideOverflow = parent.style.overflowY === "hidden";

        if (hideOverflow || xHideOverflow) {
            width = Math.min(parentCanvas.width, width);
        }
        if (hideOverflow || yHideOverflow) {
            height = Math.min(parentCanvas.height, height);
        }

        return new Canvas({
            grid: this.canvas.grid,
            width: width,
            height: height,
            corner: { x: xoff, y: yoff },
        });
    }

    public getHeight(): number {
        return this.canvas.grid.length;
    }

    public getStdout(): string {
        return this.canvas.toString();
    }
}
