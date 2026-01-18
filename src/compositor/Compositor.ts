import { FOCUS_MANAGER, Yg } from "../Constants.js";
import type { DomElement } from "../dom/DomElement.js";
import type { Root } from "../dom/RootElement.js";
import { logger } from "../shared/Logger.js";
import type { WriteOpts } from "../Types.js";
import { type Canvas, RootCanvas, SubCanvas } from "./Canvas.js";
import { DomRects } from "./DomRects.js";
import { Draw } from "./draw/Draw.js";
import { LayoutReconciler } from "./LayoutReconciler.js";

export class Compositor {
    private _root: Root;
    private _opts: WriteOpts;
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
        this._root = root;
        this._opts = _opts;
        this._canvas = new RootCanvas(root, root.runtime.stdout);
        this._draw = new Draw();
        this._rects = new DomRects();
        this._reconciler = new LayoutReconciler();

        root._canvas = this._canvas;
    }

    public calculateYogaLayout() {
        this._root._node.calculateLayout(
            this._root.runtime.stdout.columns,
            undefined,
            Yg.DIRECTION_LTR,
        );
    }

    public buildLayout() {
        if (this._opts.layoutChange) {
            this.refreshLayout();
        }
        this.composite();
    }

    public refreshLayout(
        elem: DomElement = this._root,
        canvas: Canvas = this._canvas,
        rangeContext: DomElement | undefined = undefined,
        postLayout: (() => unknown)[] = [],
    ) {
        if (elem === this._root) {
            this.calculateYogaLayout();
        }
        if (elem.style.display === "none") {
            return;
        }

        if (canvas.canDraw() && elem._is(FOCUS_MANAGER)) {
            postLayout.push(() => {
                elem._refreshVisualMap();
            });
        }
        elem._contentRange = elem._initContentRange();

        elem._children.forEach((child) => {
            this.updateChildCanvas(child, canvas);
            this.updateContentRange(child, rangeContext);

            const chstyle = child._shadowStyle.overflow;
            const overflowMgr = chstyle === "scroll" || chstyle === "hidden";
            const nextRangeCtx = overflowMgr ? child : rangeContext;

            this.refreshLayout(child, child._canvas!, nextRangeCtx, postLayout);
        });

        if (elem === this._root) {
            postLayout.forEach((cb) => cb());
        }
    }

    private composite(
        elem: DomElement = this._root,
        canvas: Canvas = this._canvas,
        nodeDepth = 0,
        relZIndex = 0,
    ) {
        if (elem.style.display === "none") return;

        const style = elem._shadowStyle;
        const zIndex = relZIndex + (style.zIndex ?? 0);

        this._draw.updateLowestLayer(zIndex);
        this._reconciler.handleElement(elem, nodeDepth);

        if (canvas.canDraw()) {
            this._rects.storeElementPosition(zIndex, elem);
            this._draw.enqueue(zIndex, elem, canvas);
        }

        for (const child of elem._children) {
            this.composite(child, child._canvas!, ++nodeDepth, zIndex);
        }

        if (elem === this._root) {
            this._draw.performOps();
            this.removeTrailingWs();
        }
    }

    /**
     * Assumes no layout work is needed but styles (coloring, borders, etc...)
     * need to be updated.
     * */
    public redrawCanvas() {
        // reset grid while preserving references, then re-perform draw ops
        const last = this.canvas.grid.map((row) => row.slice());

        this.canvas.grid.splice(0);
        last.forEach((row) => {
            const nextRow = Array.from({ length: row.length }).fill(" ") as string[];
            this.canvas.grid.push(nextRow);
        });

        this.draw.performOps();

        return last;
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
