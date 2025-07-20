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
    private canvas: Canvas;
    private layers: Record<number, (() => void)[]>;
    private positionLayers: Record<number, PositionLayer>;

    /**
     * In order to correctly handle z-indexes, Boxes on top of other layers must
     * wipe their backgrounds.  This ensures that nodes that don't need to wipe
     * backgrounds don't waste time doing so.
     */
    private minZIndex?: number;

    constructor() {
        this.canvas = new Canvas();
        this.layers = {};
        this.positionLayers = {};
    }

    public renderNode(elem: FriendDomElement, canvas: Canvas, root = false) {
        if (root) canvas = this.canvas;
        if (elem.style.display === "none") return;

        elem.rect = {
            x: canvas.corner.x,
            y: canvas.corner.y,
            height: canvas.corner.y + canvas.max.y,
            width: canvas.corner.x + canvas.max.x,
            top: canvas.corner.y,
            left: canvas.corner.x,
            right: canvas.corner.x + canvas.max.x,
            bottom: canvas.corner.y + canvas.max.y,
        };

        const zIndex = typeof elem.style.zIndex === "number" ? elem.style.zIndex : 0;
        this.minZIndex = Math.min(this.minZIndex ?? zIndex, zIndex);

        this.pushToPositionLayer(zIndex, elem);

        if (elem.tagName === "BOX_ELEMENT") {
            // this.deferOp(layer, () => this.renderBox(elem, canvas));
        }

        for (const child of elem.children) {
            let width = child.node.getComputedWidth();
            let height = child.node.getComputedHeight();

            const overflowHidden = elem.style.overflow === "hidden";
            if (overflowHidden || elem.style.overflowX === "hidden") {
                width = Math.min(elem.node.getComputedWidth(), width);
            }
            if (overflowHidden || elem.style.overflowY === "hidden") {
                height = Math.min(elem.node.getComputedHeight(), height);
            }

            const offsetX = child.node.getComputedLeft() + this.canvas.corner.x;
            const offsetY = child.node.getComputedTop() + this.canvas.corner.y;

            const childCanvas = new Canvas({
                grid: this.canvas.grid,
                dim: { width, height },
                corner: { x: offsetX, y: offsetY },
            });

            this.renderNode(child, childCanvas);
        }

        if (root) {
            const layers = Object.keys(this.layers)
                .sort((a, b) => Number(a) - Number(b))
                .map((s) => Number(s));

            for (const layer of layers) {
                this.layers[layer]?.forEach((operation) => operation());
            }
        }
    }

    public deferOp(layer: number, cb: () => unknown): void {
        this.layers[layer] = this.layers[layer] ?? [];
        this.layers[layer].push(cb);
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
}
