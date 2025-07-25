import { FriendDomElement } from "../dom/DomElement.js";
import { Canvas } from "../canvas/Canvas.js";
import { Operations } from "./Operations.js";
import { DomRects } from "./DomRects.js";
import { Draw } from "./Draw.js";
import { Style } from "../types.js";

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

    public composeTree(elem: FriendDomElement, canvas: Canvas = this.canvas) {
        if (elem.style.display === "none") return;

        const zIndex = this.getZIndex(elem);

        this.draw.updateLowestLayer(zIndex);
        this.rects.setRect(elem, canvas);
        this.rects.storeElementPosition(zIndex, elem);

        if (elem.tagName === "BOX_ELEMENT") {
            this.ops.defer(zIndex, () => this.draw.composeBox(elem, canvas, zIndex));
        }

        for (const child of elem.children) {
            const childCanvas = this.getChildCanvas(elem, canvas, child);
            this.composeTree(child, childCanvas);
        }

        if (elem.tagName === "ROOT_ELEMENT") {
            this.ops.performAll();
        }
    }

    private getChildCanvas(
        parent: FriendDomElement,
        parentCanvas: Canvas,
        child: FriendDomElement,
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
            tokens: this.canvas.tokens,
            width: width,
            height: height,
            corner: { x: xoff, y: yoff },
        });
    }

    private getZIndex(elem: FriendDomElement): number {
        return typeof elem.style.zIndex === "number" ? elem.style.zIndex : 0;
    }

    public getHeight(): number {
        return this.canvas.grid.length;
    }

    public getStdout(): string {
        return this.canvas.toString();
    }
}
