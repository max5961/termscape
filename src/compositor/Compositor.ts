import type { DomElement } from "../dom/DomElement.js";
import type { Root } from "../dom/RootElement.js";
import { FOCUS_MANAGER, ROOT_ELEMENT } from "../Constants.js";
import { type Canvas, type Grid, RootCanvas, SubCanvas } from "./Canvas.js";
import { Operations } from "./Operations.js";
import { DomRects } from "./DomRects.js";
import { Draw } from "./draw/Draw.js";
import { PostLayoutManager } from "./PostLayoutManager.js";
import type { WriteOpts } from "../Types.js";

// CHORE - Compositor.canvas name conflicts with Element._canvas...should we possibly
// call this.canvas this.root or something else, maybe rootCanvas for
// better readability

export class Compositor {
    private host: Root;
    private opts: WriteOpts;
    private postLayout: (() => unknown)[];
    public canvas: RootCanvas;
    public ops: Operations;
    public rects: DomRects;
    public draw: Draw;
    public PLM: PostLayoutManager;

    constructor(root: Root, opts: WriteOpts) {
        this.host = root;
        this.opts = opts;
        this.canvas = new RootCanvas(root, root.runtime.stdout);
        this.ops = new Operations();
        this.rects = new DomRects();
        this.draw = new Draw();
        this.PLM = new PostLayoutManager();
        this.postLayout = [];

        root._canvas = this.canvas;
    }

    public buildLayout(
        elem: DomElement,
        canvas: Canvas = this.canvas,
        rangeContext: DomElement | undefined = undefined,
        level = 0,
    ) {
        if (elem.style.display === "none") return;

        const style = elem._shadowStyle;
        const zIndex = style.zIndex ?? 0; // CHORE - zIndex needs to be incremental relative to parent

        this.draw.updateLowestLayer(zIndex);
        this.PLM.handleElement(elem, level);

        if (this.opts.layoutChange) {
            elem._contentRange = elem._initContentRange();
        }

        if (canvas.canDraw()) {
            this.rects.storeElementPosition(zIndex, elem);
            this.ops.defer(zIndex, () => this.draw.compose(elem, canvas));
            if (elem._is(FOCUS_MANAGER)) {
                if (this.opts.layoutChange) {
                    this.postLayoutDefer(() => {
                        elem.refreshVisualMap();
                    });
                }
            }
        }

        for (const child of elem._children) {
            this.updateChildCanvas(child, canvas);

            if (this.opts.layoutChange) {
                this.updateContentRange(child, rangeContext);
            }

            // The contentRange of a child that controls overflow is no longer
            // relevant to any parents who also control overflow, so child now
            // owns the context of its children.
            const chstyle = child._shadowStyle.overflow;
            const overflowMgr = chstyle === "scroll" || chstyle === "hidden";
            const nextRangeCtx = overflowMgr ? child : rangeContext;

            this.buildLayout(child, child._canvas!, nextRangeCtx, ++level);
        }

        if (elem._is(ROOT_ELEMENT)) {
            this.ops.performAll();
            this.postLayout.forEach((cb) => cb());
        }
    }

    private updateChildCanvas(child: DomElement, parent: Canvas) {
        if (!child._canvas) {
            child._canvas = new SubCanvas(child, this.host, parent);
        } else if (this.opts.layoutChange) {
            child._canvas.constrainToLayout(parent);
        }

        child._canvas.bindContext(this.canvas.grid, this.canvas.stdout);
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
