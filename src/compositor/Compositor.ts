import type { DomElement, FocusManager } from "../dom/DomElement.js";
import type { Root } from "../dom/Root.js";
import { FOCUS_MANAGER, ROOT_ELEMENT } from "../Constants.js";
import { Canvas, type SubCanvas } from "./Canvas.js";
import { Operations } from "./Operations.js";
import { DomRects } from "./DomRects.js";
import { Draw } from "./Draw.js";

export class Compositor {
    public canvas: Canvas;
    public ops: Operations;
    public rects: DomRects;
    public draw: Draw;
    public focusManagers: FocusManager[];
    public scrollManagers: DomElement[];
    private postLayout: (() => unknown)[];
    public afterLayoutHandlers: (() => unknown)[];

    constructor(root: Root) {
        this.canvas = new Canvas({ stdout: root.runtime.stdout, el: root });
        root.canvas = this.canvas;
        this.ops = new Operations();
        this.rects = new DomRects();
        this.draw = new Draw();
        this.postLayout = [];
        this.focusManagers = [];
        this.scrollManagers = [];
        this.afterLayoutHandlers = [];
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

        if (elem.afterLayoutHandlers.size) {
            this.afterLayoutHandlers.push(...elem.afterLayoutHandlers.values());
        }

        if (canvas.canDraw()) {
            this.rects.storeElementPosition(zIndex, elem);
            this.ops.defer(zIndex, () => this.draw.compose(elem, canvas));
            if (elem.is(FOCUS_MANAGER)) {
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

        for (const child of elem._children) {
            child.canvas = this.getRefreshedChildCanvas(child, canvas, layoutChange);

            if (layoutChange) {
                parentScrollManagers.forEach((scroller) => {
                    const unclippedChild = child.unclippedRect;
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

        if (elem.is(ROOT_ELEMENT)) {
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

    public getHeight(): number {
        return this.canvas.grid.length;
    }

    public getStdout(): string {
        return this.canvas.toString();
    }
}
