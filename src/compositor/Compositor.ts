import { FOCUS_MANAGER, ROOT_ELEMENT } from "../Constants.js";
import type { DomElement } from "../dom/DomElement.js";
import type { Root } from "../dom/RootElement.js";
import type { WriteOpts } from "../Types.js";
import { type Canvas, RootCanvas, SubCanvas } from "./Canvas.js";
import { DomRects } from "./DomRects.js";
import { Draw } from "./draw/Draw.js";
import { LayoutReconciler } from "./LayoutReconciler.js";

export class Compositor {
    private _opts: WriteOpts;
    private _postLayout: (() => unknown)[];
    private _draw: Draw;
    private _canvas: RootCanvas;
    private _rects: DomRects;
    private _reconciler: LayoutReconciler;

    public get canvas(): Canvas {
        return this._canvas;
    }
    public get reconciler(): Readonly<LayoutReconciler> {
        return this._reconciler;
    }
    public get draw(): Readonly<Draw> {
        return this._draw;
    }
    public get rects(): Readonly<DomRects> {
        return this._rects;
    }

    constructor(root: Root, _opts: WriteOpts) {
        this._opts = _opts;
        this._canvas = new RootCanvas(root, root.runtime.stdout);
        this._draw = new Draw();
        this._rects = new DomRects();
        this._reconciler = new LayoutReconciler();
        this._postLayout = [];

        root._canvas = this._canvas;
    }

    public buildLayout(
        elem: DomElement,
        canvas: Canvas = this._canvas,
        rangeContext: DomElement | undefined = undefined,
        level = 0,
        relIndex = 0,
    ) {
        if (elem.style.display === "none") return;

        const style = elem._shadowStyle;
        const zIndex = relIndex + (style.zIndex ?? 0);

        this._draw.updateLowestLayer(zIndex);
        this._reconciler.handleElement(elem, level);

        if (this._opts.layoutChange) {
            elem._contentRange = elem._initContentRange();
        }

        if (canvas.canDraw()) {
            this._rects.storeElementPosition(zIndex, elem);
            this._draw.enqueue(zIndex, elem, canvas);

            if (elem._is(FOCUS_MANAGER) && this._opts.layoutChange) {
                this._postLayout.push(() => {
                    elem._refreshVisualMap();
                });
            }
        }

        for (const child of elem._children) {
            this.updateChildCanvas(child, canvas);

            if (this._opts.layoutChange) {
                this.updateContentRange(child, rangeContext);
            }

            // The contentRange of a child that controls overflow is no longer
            // relevant to any parents who also control overflow, so child now
            // owns the context of its children.
            const chstyle = child._shadowStyle.overflow;
            const overflowMgr = chstyle === "scroll" || chstyle === "hidden";
            const nextRangeCtx = overflowMgr ? child : rangeContext;

            this.buildLayout(child, child._canvas!, nextRangeCtx, ++level, zIndex);
        }

        if (elem._is(ROOT_ELEMENT)) {
            this._draw.performOps();
            this._postLayout.forEach((cb) => cb());
            this.removeTrailingWs();
        }
    }

    private updateChildCanvas(child: DomElement, parent: Canvas) {
        if (!child._canvas) {
            child._canvas = new SubCanvas(child, parent);
        } else if (this._opts.layoutChange && child._canvas instanceof SubCanvas) {
            child._canvas.constrainToLayout(parent);
        }

        child._canvas.bindContext(this._canvas.grid, this._canvas.stdout);
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

    private removeTrailingWs() {
        this.canvas.grid.forEach((row) => {
            let i = row.length - 1;
            while (row[i--] === " ") {
                row.pop();
            }
        });
    }
}
