import { FriendDomElement } from "../dom/DomElement.js";
import { Canvas } from "./Canvas.js";

/**
 * Used in mouse event handling
 */
export type PositionLayer = {
    x: Record<number, FriendDomElement[]>;
    y: Record<number, FriendDomElement[]>;
};

export class Layout {
    public canvas: Canvas;
    private layers: Record<number, (() => void)[]>;
    private positionLayers: Record<number, PositionLayer>;

    /**
     * In order to correctly render z-indexes, Boxes on top of other layers must
     * wipe their backgrounds.  This ensures that nodes that don't need to wipe
     * backgrounds don't waste time doing so.
     */
    private minZIndex: number;

    constructor() {
        this.canvas = new Canvas();
        this.layers = {};
        this.positionLayers = {};
        this.minZIndex = 0;
    }

    public draw(elem: FriendDomElement, canvas: Canvas = this.canvas) {
        if (elem.style.display === "none") return;

        this.setRect(elem, canvas);

        const zIndex = typeof elem.style.zIndex === "number" ? elem.style.zIndex : 0;
        this.minZIndex = Math.min(this.minZIndex, zIndex);
        this.pushToPositionLayer(zIndex, elem);

        if (elem.tagName === "BOX_ELEMENT") {
            this.deferOp(zIndex, () => this.renderBox(elem, canvas, zIndex));
        }

        for (const child of elem.children) {
            const childCanvas = this.getChildCanvas(elem, canvas, child);
            this.draw(child, childCanvas);
        }

        if (elem.tagName === "ROOT_ELEMENT") {
            this.performOps();
        }
    }

    public deferOp(layer: number, cb: () => unknown): void {
        this.layers[layer] = this.layers[layer] ?? [];
        this.layers[layer].push(cb);
    }

    public performOps() {
        const layers = Object.keys(this.layers)
            .sort((a, b) => Number(a) - Number(b))
            .map((s) => Number(s));

        for (const layer of layers) {
            this.layers[layer]?.forEach((operation) => operation());
        }
    }

    public setRect(elem: FriendDomElement, canvas: Canvas) {
        elem.rect = {
            x: canvas.corner.x,
            y: canvas.corner.y,
            height: canvas.height,
            width: canvas.width,
            top: canvas.corner.y,
            left: canvas.corner.x,
            right: canvas.corner.x + canvas.width,
            bottom: canvas.corner.y + canvas.height,
        };
    }

    public getChildCanvas(
        parent: FriendDomElement,
        parentCanvas: Canvas,
        child: FriendDomElement,
    ): Canvas {
        let width = child.node.getComputedWidth();
        let height = child.node.getComputedHeight();
        const xoff = parentCanvas.corner.x + child.node.getComputedTop();
        const yoff = parentCanvas.corner.y + child.node.getComputedLeft();

        const hideOverflow = parent.style.overflow === "hidden";
        const xHideOverflow = parent.style.overflowX === "hidden";
        const yHideOverflow = parent.style.overflowY === "hidden";

        if (hideOverflow || xHideOverflow) {
            width = Math.min(parentCanvas.width, width);
        }
        if (hideOverflow || yHideOverflow) {
            height = Math.min(parentCanvas.height, height);
        }

        return new Canvas({
            grid: this.canvas.grid,
            dim: { width, height },
            corner: { x: xoff, y: yoff },
        });
    }

    public pushToPositionLayer(zIndex: number, elem: FriendDomElement) {
        const x = elem.rect!.x;
        const y = elem.rect!.y;

        this.positionLayers[zIndex] = this.positionLayers[zIndex] ?? {
            x: {},
            y: {},
        };

        this.positionLayers[zIndex].x[x] = this.positionLayers[zIndex].x[x] ?? [];
        this.positionLayers[zIndex].y[y] = this.positionLayers[zIndex].y[y] ?? [];

        this.positionLayers[zIndex].x[x].push(elem);
        this.positionLayers[zIndex].y[y].push(elem);
    }

    public findTargetElement(x: number, y: number): FriendDomElement | undefined {
        // Sort descending
        const sortedLayers = Object.keys(this.positionLayers)
            .sort((a, b) => Number(b) - Number(a))
            .map((s) => Number(s));

        for (const layerIdx of sortedLayers) {
            // Decide if we should traverse the X or Y axis. It makes more sense
            // to traverse whichever contains the most unique points.  For example,
            // imagine an up-down list/stack of elements.  We'd need to check every
            // element if we checked the X axis, but if we check the Y axis, there
            // is a good chance the first element we bump into is a match.

            const layer = this.positionLayers[layerIdx];
            const traverseX = Object.keys(layer.x).length > Object.keys(layer.y).length;
            const map = traverseX ? layer.x : layer.y;
            let i = traverseX ? x : y;

            while (i >= 0) {
                if (map[i]) {
                    for (const elem of map[i]) {
                        if (elem.containsPoint(x, y)) return elem;
                    }
                }
                --i;
            }
        }

        return undefined;
    }

    public getHeight(): number {
        return this.canvas.grid.length;
    }

    public getStdout(): string {
        return this.canvas.toString();
    }

    private renderBox(elem: FriendDomElement, canvas: Canvas, zIndex: number) {
        if (zIndex > this.minZIndex) {
            this.fillBackground(canvas);
        }

        if (elem.style.borderStyle === "round") {
            this.renderBorder(elem, canvas);
        }
    }

    /** renders only round borders for now */
    private renderBorder(elem: FriendDomElement, canvas: Canvas) {
        const width = elem.node.getComputedWidth();
        const height = elem.node.getComputedHeight();

        const pen = canvas.getPen({ linked: false });

        pen.draw("╭", "R", 1)
            .draw("─", "R", width - 2)
            .draw("╮", "D", 1)
            .draw("│", "D", height - 2)
            .draw("╯", "L", 1)
            .draw("─", "L", width - 2)
            .draw("╰", "U", 1)
            .draw("│", "U", height - 2);
    }

    private fillBackground(canvas: Canvas, color?: string) {
        const pen = canvas.getPen();

        for (let y = canvas.corner.y; y < canvas.height; ++y) {
            pen.moveTo(canvas.corner.x, y);
            pen.draw(" ", "R", canvas.width);
        }
    }
}
