import { DomElement, FocusManager } from "../dom/DomElement.js";
import { Canvas, type SubCanvas } from "./Canvas.js";
import { Operations } from "./Operations.js";
import { DomRects } from "./DomRects.js";
import { Draw } from "./Draw.js";
import { BoxElement } from "../dom/BoxElement.js";
import { TextElement } from "../dom/TextElement.js";
import { Root } from "../dom/Root.js";
import { BookElement } from "../dom/BookElement.js";
import { LayoutElement, LayoutNode } from "../dom/LayoutElement.js";
import { ListElement } from "../dom/ListElement.js";
import { CanvasElement } from "../dom/CanvasElement.js";
import type { FocusManagerBaseProps } from "../Props.js";
import type { BaseStyle } from "../style/Style.js";

export class Compositor {
    public canvas: Canvas;
    public ops: Operations;
    public rects: DomRects;
    public draw: Draw;
    public focusManagers: FocusManager<{
        Style: BaseStyle;
        Props: FocusManagerBaseProps;
    }>[];
    public scrollManagers: DomElement[];
    private postLayout: (() => unknown)[];
    public elementsWithPostLayoutHooks: DomElement[];

    constructor(root: Root) {
        this.canvas = new Canvas({ stdout: root.runtime.stdout, el: root });
        root.canvas = this.canvas;
        this.ops = new Operations();
        this.rects = new DomRects();
        this.draw = new Draw();
        this.postLayout = [];
        this.focusManagers = [];
        this.scrollManagers = [];
        this.elementsWithPostLayoutHooks = [];
    }

    public buildLayout(
        elem: DomElement,
        layoutChange: boolean,
        canvas: Canvas = this.canvas,
        parentScrollManagers: DomElement[] = [],
    ) {
        if (elem.style.display === "none") return;

        const style = elem.shadowStyle;
        const zIndex = style.zIndex ?? 0;

        this.draw.updateLowestLayer(zIndex);
        this.rects.setRect(elem, canvas);

        if (elem.postLayoutHooks.size) {
            this.elementsWithPostLayoutHooks.push(elem);
        }

        if (canvas.canDraw()) {
            this.rects.storeElementPosition(zIndex, elem);

            if (this.isBoxLike(elem)) {
                this.ops.defer(zIndex, () => this.draw.composeBox(elem, style, canvas));
            }

            if (elem instanceof TextElement) {
                this.ops.defer(zIndex, () => this.draw.composeText(elem, style, canvas));
            }

            if (elem instanceof CanvasElement) {
                const draw = elem.getProp("draw");
                if (draw) {
                    const pen = canvas.getPen();
                    this.ops.defer(zIndex, () => draw(pen));
                }
            }

            if (elem instanceof FocusManager) {
                if (layoutChange) {
                    this.postLayoutDefer(() => {
                        elem.refreshVisualMap();
                    });
                }

                this.focusManagers.push(elem);
            }
        }

        if (layoutChange) {
            elem.contentRange = elem.initContentRange();
        }

        if (elem.style.overflow === "scroll") {
            this.scrollManagers.push(elem);
            parentScrollManagers.push(elem);
        }

        for (const child of elem.__children__) {
            child.canvas = this.getRefreshedChildCanvas(child, canvas, layoutChange);

            if (layoutChange) {
                parentScrollManagers.forEach((scroller) => {
                    const unclippedChild = child.getUnclippedRect();
                    if (unclippedChild) {
                        scroller.contentRange.high = Math.min(
                            scroller.contentRange.high,
                            unclippedChild.corner.y,
                        );
                        scroller.contentRange.low = Math.max(
                            scroller.contentRange.low,
                            unclippedChild.corner.y + unclippedChild.height,
                        );
                        scroller.contentRange.left = Math.min(
                            scroller.contentRange.left,
                            unclippedChild.corner.x,
                        );
                        scroller.contentRange.right = Math.max(
                            scroller.contentRange.right,
                            unclippedChild.corner.x + unclippedChild.width,
                        );
                    }
                });
            }

            this.buildLayout(child, layoutChange, child.canvas, [
                ...parentScrollManagers,
            ]);
        }

        if (elem instanceof Root) {
            this.ops.performAll();
            this.postLayout.forEach((cb) => cb());
        }
    }

    private getRefreshedChildCanvas(
        child: DomElement,
        canvas: Canvas,
        layoutChange: boolean,
    ): Canvas {
        if (layoutChange || !child.canvas) {
            child.canvas = canvas.createChildCanvas(child);
        }
        (child.canvas as SubCanvas).bindGrid(this.canvas.grid);
        return child.canvas;
    }

    private postLayoutDefer(cb: () => unknown): void {
        this.postLayout.push(cb);
    }

    private isBoxLike(elem: DomElement) {
        return (
            elem instanceof BoxElement ||
            elem instanceof BookElement ||
            elem instanceof ListElement ||
            elem instanceof LayoutElement ||
            elem instanceof LayoutNode
        );
    }

    public getHeight(): number {
        return this.canvas.grid.length;
    }

    public getStdout(): string {
        return this.canvas.toString();
    }
}
