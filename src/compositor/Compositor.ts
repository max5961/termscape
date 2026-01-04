import type { DomElement } from "../dom/DomElement.js";
import type { Root } from "../dom/RootElement.js";
import { FOCUS_MANAGER, ROOT_ELEMENT } from "../Constants.js";
import { Canvas, type SubCanvas } from "./Canvas.js";
import { Operations } from "./Operations.js";
import { DomRects } from "./DomRects.js";
import { Draw } from "./draw/Draw.js";
import { PostLayoutManager } from "./PostLayoutManager.js";

export class Compositor {
    private postLayout: (() => unknown)[];
    public canvas: Canvas;
    public ops: Operations;
    public rects: DomRects;
    public draw: Draw;
    public PLM: PostLayoutManager;

    constructor(root: Root) {
        // FLAG - this name conflicts with Element._canvas...should we possibly
        // call this.canvas this.root or something else, maybe rootCanvas for
        // better readability

        this.canvas = new Canvas({ stdout: root.runtime.stdout, el: root });
        root._canvas = this.canvas;
        this.ops = new Operations();
        this.rects = new DomRects();
        this.draw = new Draw();
        this.PLM = new PostLayoutManager();
        this.postLayout = [];
    }

    public buildLayout(
        elem: DomElement,
        layoutChange: boolean,
        canvas: Canvas = this.canvas,
        rangeContext: DomElement | undefined = undefined,
        level = 0,
    ) {
        if (elem.style.display === "none") return;

        const style = elem._shadowStyle;
        const zIndex = style.zIndex ?? 0;

        this.draw.updateLowestLayer(zIndex);
        this.PLM.handleElement(elem, level);

        if (layoutChange) {
            elem._contentRange = elem._initContentRange();
        }

        if (canvas.canDraw()) {
            this.rects.storeElementPosition(zIndex, elem);
            this.ops.defer(zIndex, () => this.draw.compose(elem, canvas));
            if (elem._is(FOCUS_MANAGER)) {
                if (layoutChange) {
                    this.postLayoutDefer(() => {
                        elem.refreshVisualMap();
                    });
                }
            }
        }

        for (const child of elem._children) {
            child._canvas = this.getRefreshedChildCanvas(child, canvas, layoutChange);

            if (layoutChange) {
                this.updateContentRange(child, rangeContext);
            }

            // The contentRange of a child that controls overflow is no longer
            // relevant to any parents who also control overflow, so child now
            // owns the context of its children.
            const chstyle = child._shadowStyle.overflow;
            const overflowMgr = chstyle === "scroll" || chstyle === "hidden";
            const nextRangeCtx = overflowMgr ? child : rangeContext;

            this.buildLayout(child, layoutChange, child._canvas, nextRangeCtx, ++level);
        }

        if (elem._is(ROOT_ELEMENT)) {
            this.ops.performAll();
            this.postLayout.forEach((cb) => cb());
        }
    }

    private getRefreshedChildCanvas(
        child: DomElement,
        canvas: Canvas,
        layoutChange: boolean,
    ): Canvas {
        if (layoutChange || !child._canvas) {
            child._canvas = canvas.createChildCanvas(child);
        }
        (child._canvas as SubCanvas).bindGrid(this.canvas.grid);
        return child._canvas;
    }

    private updateContentRange(child: DomElement, scroller: DomElement | undefined) {
        if (!scroller) return;

        const unclippedChild = child.unclippedRect;
        if (unclippedChild) {
            scroller._contentRange.high = Math.min(
                scroller._contentRange.high,
                unclippedChild.corner.y,
            );
            scroller._contentRange.low = Math.max(
                scroller._contentRange.low,
                unclippedChild.corner.y + unclippedChild.height,
            );
            scroller._contentRange.left = Math.min(
                scroller._contentRange.left,
                unclippedChild.corner.x,
            );
            scroller._contentRange.right = Math.max(
                scroller._contentRange.right,
                unclippedChild.corner.x + unclippedChild.width,
            );
        }
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
