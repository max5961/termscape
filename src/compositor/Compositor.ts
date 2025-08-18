import { DomElement } from "../dom/DomElement.js";
import { Canvas } from "./Canvas.js";
import { Operations } from "./Operations.js";
import { DomRects } from "./DomRects.js";
import { Draw } from "./Draw.js";
import { DOM_ELEMENT_SHADOW_STYLE } from "../Symbols.js";
import { BoxElement } from "../dom/BoxElement.js";
import { TextElement } from "../dom/TextElement.js";
import type { Root } from "../dom/Root.js";
import type { ShadowStyle } from "../Types.js";

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

        if (elem instanceof BoxElement) {
            this.ops.defer(zIndex, () => this.draw.composeBox(elem, style, canvas));
        }

        if (elem instanceof TextElement) {
            this.ops.defer(zIndex, () => this.draw.composeText(elem, style, canvas));
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
        const childNode = child.node;
        const childStyle = child[DOM_ELEMENT_SHADOW_STYLE];

        return pcanvas.createChildCanvas({
            childNode,
            childStyle,
            parentStyle,
        });
    }

    public getHeight(): number {
        return this.canvas.grid.length;
    }

    public getStdout(): string {
        return this.canvas.toString();
    }
}
