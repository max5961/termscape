import type { DomElement } from "../dom/DomElement.js";
import type { FocusManager } from "../dom/FocusManager.js";
import type { Root } from "../dom/RootElement.js";
import { FOCUS_MANAGER, ROOT_ELEMENT } from "../Constants.js";
import { Canvas, type SubCanvas } from "./Canvas.js";
import { Operations } from "./Operations.js";
import { DomRects } from "./DomRects.js";
import { Draw } from "./Draw.js";

export class Compositor {
    private postLayout: (() => unknown)[];
    public canvas: Canvas;
    public ops: Operations;
    public rects: DomRects;
    public draw: Draw;
    public focusManagers: FocusManager[];
    public scrollManagers: DomElement[];
    public afterLayoutHandlers: (() => unknown)[];
    public forceRecompositeHandlers: (() => boolean)[];

    constructor(root: Root) {
        this.canvas = new Canvas({ stdout: root.runtime.stdout, el: root });
        root._canvas = this.canvas;
        this.ops = new Operations();
        this.rects = new DomRects();
        this.draw = new Draw();
        this.forceRecompositeHandlers = [];
        this.postLayout = [];
        this.focusManagers = [];
        this.scrollManagers = [];
        this.afterLayoutHandlers = [];
    }

    public buildLayout(
        elem: DomElement,
        layoutChange: boolean,
        canvas: Canvas = this.canvas,
        parentScrollManagers: Set<DomElement> = new Set(),
    ) {
        if (elem.style.display === "none") return;

        const style = elem._shadowStyle;
        const zIndex = style.zIndex ?? 0;

        this.draw.updateLowestLayer(zIndex);

        if (elem._afterLayoutHandlers.size) {
            this.afterLayoutHandlers.push(...elem._afterLayoutHandlers.values());
        }

        if (elem._forceRecompositeHandlers.size) {
            this.forceRecompositeHandlers.push(
                ...elem._forceRecompositeHandlers.values(),
            );
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

                this.focusManagers.push(elem);
            }
        }

        if (layoutChange) {
            elem._contentRange = elem._initContentRange();
        }

        if (elem.style.overflow === "scroll") {
            this.scrollManagers.push(elem);
            parentScrollManagers.add(elem);
        }

        for (const child of elem._children) {
            child._canvas = this.getRefreshedChildCanvas(child, canvas, layoutChange);

            if (layoutChange) {
                parentScrollManagers.forEach((scroller) => {
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
                });
            }

            const nextPSM = new Set(parentScrollManagers);

            // The contentRange of a child that controls overflow is no longer
            // relevant to any parent scroll managers.  Only the rect of the child
            // itself is relevant letting the contentRange bubble to the child's
            // children breaks scrolling.  You can have nested scrolling, but
            // each scroll needs their own truth.
            if (
                child._shadowStyle.overflow === "scroll" ||
                child._shadowStyle.overflow === "hidden"
            ) {
                nextPSM.delete(elem);
            }

            this.buildLayout(child, layoutChange, child._canvas, nextPSM);
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
