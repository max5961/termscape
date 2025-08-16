import { DOM_ELEMENT_SHADOW_STYLE, DomElement } from "../dom/DomElement.js";
import { Canvas } from "../canvas/Canvas.js";
import { Operations } from "./Operations.js";
import { DomRects } from "./DomRects.js";
import { Draw } from "./Draw.js";
import type { Root } from "../dom/Root.js";
import type { ShadowStyle } from "../style/Style.js";

export class Compositor {
    public canvas: Canvas;
    public ops: Operations;
    public rects: DomRects;
    public draw: Draw;

    constructor(root: Root) {
        this.canvas = new Canvas({ stdout: root.runtime.stdout });
        this.ops = new Operations();
        this.rects = new DomRects();
        this.draw = new Draw();
    }

    public buildLayout(elem: DomElement, canvas: Canvas = this.canvas) {
        if (elem.style.display === "none") return;

        const style = elem[DOM_ELEMENT_SHADOW_STYLE];
        const zIndex = style.zIndex ?? 0;

        this.draw.updateLowestLayer(zIndex);
        this.rects.setRect(elem, canvas);
        this.rects.storeElementPosition(zIndex, elem);

        if (elem.tagName === "BOX_ELEMENT") {
            this.ops.defer(zIndex, () => this.draw.composeBox(elem, style, canvas));
        }

        for (const child of elem.children) {
            const subCanvas = this.getSubCanvas(child, canvas, style);
            this.buildLayout(child, subCanvas);
        }

        if (elem.tagName === "ROOT_ELEMENT") {
            this.ops.performAll();
        }
    }

    private getSubCanvas(
        child: DomElement,
        pcanvas: Canvas,
        parentStyle: ShadowStyle,
    ): Canvas {
        const width = child.node.getComputedWidth();
        const height = child.node.getComputedHeight();
        const xoff = child.node.getComputedLeft() + pcanvas.corner.x;
        const yoff = child.node.getComputedTop() + pcanvas.corner.y;
        const style = child[DOM_ELEMENT_SHADOW_STYLE];

        return pcanvas.createSubCanvas({
            corner: { x: xoff, y: yoff },
            nodeHeight: height,
            nodeWidth: width,
            canOverflowX: style.overflowX === "visible",
            canOverflowY: style.overflowY === "visible",
            parentStyle: parentStyle,
        });
    }

    public getHeight(): number {
        return this.canvas.grid.length;
    }

    public getStdout(): string {
        return this.canvas.toString();
    }
}
