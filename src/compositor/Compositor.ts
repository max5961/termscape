import { VISUAL_FOCUS_CONTROLLER, Yg } from "../Constants.js";
import type { DomElement } from "../dom/DomElement.js";
import type { Root } from "../dom/RootElement.js";
import { logger } from "../shared/Logger.js";
import type { WriteOpts } from "../Types.js";
import { type Canvas, SubCanvas } from "./Canvas.js";
import type { DomRects } from "./DomRects.js";
import type { Draw } from "./draw/Draw.js";
import { LayoutReconciler } from "./LayoutReconciler.js";

export class Compositor {
    private reconciler: LayoutReconciler;
    private opts: WriteOpts;
    private readonly root: Root;
    private readonly draw: Draw;
    private readonly rects: DomRects;
    private buildLayoutPasses: number;

    constructor(root: Root, opts: WriteOpts, draw: Draw, rects: DomRects) {
        this.root = root;
        this.opts = opts;
        this.draw = draw;
        this.rects = rects;
        this.reconciler = new LayoutReconciler();
        this.buildLayoutPasses = 0;
    }

    public buildLayout() {
        this.calculateYogaLayout();

        // Checking whether or not there is a layout change before resetting the grid
        // fixes the "no write opts causes no render" bug.
        //
        // We need to ensure that it is safe to NOT reset the grid when there is
        // no layout change.
        //
        // The reason resetting the grid when there is no layout change causes issues
        // is that the grid is forced to accomodate only when an attached subcanvas
        // updates its place in the layout.  So we end up with a literal [] for
        // the grid when there is no layout change.
        if (this.opts.layoutChange) {
            this.root._canvas.resetGrid();
        } else {
            this.root._canvas.clearGrid();
        }

        this.build();

        if (++this.buildLayoutPasses <= 1) {
            this.reconcileLayout();
        }
    }

    private calculateYogaLayout() {
        const width = this.root.runtime.stdout.columns;
        const height = undefined;
        const direction = Yg.DIRECTION_LTR;
        this.root._node.calculateLayout(width, height, direction);
    }

    private build(
        elem: DomElement = this.root,
        canvas: Canvas = this.root._canvas,
        scroller: DomElement | undefined = undefined,
        postLayout: (() => unknown)[] = [],
        relZIndex = 0,
        nodeDepth = 0,
    ) {
        if (elem.style.display === "none") return;

        if (this.opts.layoutChange) {
            elem._scrollService.resetContentRange();

            if (canvas.canDraw() && elem._is(VISUAL_FOCUS_CONTROLLER)) {
                postLayout.push(() => {
                    elem._focusService.refreshVisualMap();
                });
            }
        }

        const zIndex = relZIndex + elem._shadow.zIndex;
        this.reconciler.handleElement(elem, nodeDepth);

        if (canvas.canDraw()) {
            this.draw.updateLowestLayer(zIndex);
            this.rects.storeElementPosition(zIndex, elem);
            this.draw.enqueue(zIndex, elem, canvas);
        }

        for (let i = 0; i < elem._treeService.children.length; ++i) {
            const child = elem._treeService.children[i];

            let nextScroller = scroller;
            if (this.opts.layoutChange) {
                this.updateChildCanvas(child, canvas);
                scroller?._scrollService.updateContentRange(child);

                // TODO - does this account for isolated overflowX and overflowY;
                const overflow = child._virtual.overflow;
                const childClipsOverflow = overflow === "scroll" || overflow === "hidden";
                nextScroller = childClipsOverflow ? child : scroller;
            }

            this.build(
                child,
                child._canvas,
                nextScroller,
                postLayout,
                zIndex,
                nodeDepth + 1,
                // if shit starts fucken up try this for some reason thats what we had before
                // but pretty sure it was just a bug that didn't happen to take form
                // ++nodeDepth,
            );
        }

        if (elem === this.root) {
            postLayout.forEach((cb) => cb());
        }
    }

    private updateChildCanvas(child: DomElement, parent: Canvas) {
        if (!child._canvas) {
            child._canvas = new SubCanvas(this.root._canvas, child, parent);
        } else if (child._canvas instanceof SubCanvas) {
            child._canvas.constrainToLayout(parent);
        }
    }

    private reconcileLayout() {
        const recompose = (cb: () => boolean) => {
            this.opts = {};
            if (cb()) {
                this.opts.layoutChange = true;
                logger.write("RECOMPOSE");
                this.buildLayout();
            }
        };

        // Order Matters: CB -> Yoga -> Recompose
        const withYoga = (cb: () => boolean) => {
            recompose(() => {
                const result = cb();
                if (result) this.calculateYogaLayout();
                return result;
            });
        };

        const sorted = this.reconciler.getSorted();
        sorted.afterLayout.forEach(withYoga);
        sorted.scrollManagers.forEach(recompose);
        sorted.focusManagers.forEach(recompose);
    }
}
