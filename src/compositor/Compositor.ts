import { DomElement, FocusManager } from "../dom/DomElement.js";
import { Canvas, type SubCanvas } from "./Canvas.js";
import { Operations } from "./Operations.js";
import { DomRects } from "./DomRects.js";
import { Draw } from "./Draw.js";
import { DOM_ELEMENT_SHADOW_STYLE, DOM_ELEMENT_CANVAS } from "../Symbols.js";
import { BoxElement } from "../dom/BoxElement.js";
import { TextElement } from "../dom/TextElement.js";
import { Root } from "../dom/Root.js";
import { LayoutElement } from "../dom/LayoutElement.js";
import { PagesElement } from "../dom/PagesElement.js";

export class Compositor {
    public canvas: Canvas;
    public ops: Operations;
    public rects: DomRects;
    public draw: Draw;
    private postLayout: (() => unknown)[];

    constructor(root: Root) {
        this.canvas = new Canvas({ stdout: root.runtime.stdout });
        root[DOM_ELEMENT_CANVAS] = this.canvas;
        this.ops = new Operations();
        this.rects = new DomRects();
        this.draw = new Draw();
        this.postLayout = [];
    }

    public buildLayout(
        elem: DomElement,
        layoutChange: boolean,
        canvas: Canvas = this.canvas,
    ) {
        if (elem.parentElement instanceof PagesElement && !elem.getFocus()) {
            return;
        }
        // TODO - this needs to be recursive in order to nullify rects
        // changes from display none to flex should also warrant a `layoutChange`
        if (elem.style.display === "none") return;

        const style = elem[DOM_ELEMENT_SHADOW_STYLE];
        const zIndex = style.zIndex ?? 0;

        this.draw.updateLowestLayer(zIndex);

        if (layoutChange) {
            this.rects.setRect(elem, canvas);
            this.rects.storeElementPosition(zIndex, elem);
        }

        if (canvas.canDraw()) {
            if (elem instanceof BoxElement) {
                this.ops.defer(zIndex, () => this.draw.composeBox(elem, style, canvas));
            }

            if (elem instanceof TextElement) {
                this.ops.defer(zIndex, () => this.draw.composeText(elem, style, canvas));
            }

            if (elem instanceof FocusManager && layoutChange) {
                this.postLayoutDefer(() => {
                    elem.refreshVisualMap();
                });
            }
        }

        for (const child of elem.children) {
            let subCanvas = child[DOM_ELEMENT_CANVAS] as SubCanvas | null;

            if (layoutChange || !subCanvas) {
                subCanvas = this.getSubCanvas(child, elem, canvas);
            }

            subCanvas.setGrid(this.canvas.grid);
            child[DOM_ELEMENT_CANVAS] = subCanvas;
            this.buildLayout(child, layoutChange, subCanvas);
        }

        if (elem instanceof Root) {
            this.ops.performAll();
            this.postLayout.forEach((cb) => cb());
        }
    }

    private getSubCanvas(child: DomElement, elem: DomElement, canvas: Canvas): SubCanvas {
        return canvas.createChildCanvas({
            child,
            elem,
        });
    }

    private postLayoutDefer(cb: () => unknown): void {
        this.postLayout.push(cb);
    }

    public getHeight(): number {
        return this.canvas.grid.length;
    }

    public getStdout(): string {
        return this.canvas.toString();
    }
}
