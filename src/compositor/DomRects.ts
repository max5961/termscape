import { Canvas } from "./Canvas.js";
import { DomElement } from "../dom/DomElement.js";

export type DomRectLayer = {
    x: Record<number, DomElement[]>;
    y: Record<number, DomElement[]>;
};

/**
 * Each `DomElement` in the tree is stored in layers according to their z-indexes
 * and pushed to an `x` and `y` array based on their x and y corner position.  This
 * represents the left and up boundaries for that particular element.  To check
 * which element contains a given x,y point (if any), the left and up boundaries
 * are checked for each DomElement in the `layers` store.
 *
 * - Higher z-indexes are checked first
 * - For each z-index layer, we test traverse either left or up from the given
 *   point and check the x or y DomElement array for elements that contain that point.
 * - To visualize, imagine a up-down list/stack of rectangles that stretch the
 *   entire width of the screen.  This means each rectangle would start at 0 on
 *   the x-axis.  If we are checking point `(5,10)`, then we find the closest `x corner`
 *   in the layer.  This would be 0, then we would check every DomElement in that
 *   array and see if it contains the point `(5,10)`, returning the one that does.
 *   This works, but if we checked the closest rectangle to the y coordinate, it
 *   would be an immediate match with this simple example.  Therefore, we always
 *   check whichever axis contains more unique values.
 */
export class DomRects {
    private layers: Record<number, DomRectLayer>;

    constructor() {
        this.layers = {};
    }

    public setRect(elem: DomElement, canvas: Canvas) {
        elem.rect = canvas.getDomRect();
    }

    public storeElementPosition(zIndex: number, elem: DomElement) {
        const x = elem.rect.x;
        const y = elem.rect.y;

        this.layers[zIndex] = this.layers[zIndex] ?? {
            x: {},
            y: {},
        };

        this.layers[zIndex].x[x] = this.layers[zIndex].x[x] ?? [];
        this.layers[zIndex].y[y] = this.layers[zIndex].y[y] ?? [];

        this.layers[zIndex].x[x].push(elem);
        this.layers[zIndex].y[y].push(elem);
    }

    public findTargetElement(x: number, y: number): DomElement | undefined {
        const sortedLayers = Object.keys(this.layers)
            .sort((a, b) => Number(b) - Number(a))
            .map((s) => Number(s));

        for (const layerIdx of sortedLayers) {
            const layer = this.layers[layerIdx];
            const traverseX = Object.keys(layer.x).length > Object.keys(layer.y).length;
            const map = traverseX ? layer.x : layer.y;
            let i = traverseX ? x : y;

            while (i >= 0) {
                if (map[i]) {
                    // Ensure that the last added (most visible) elements are checked first
                    for (let j = map[i].length - 1; j >= 0; --j) {
                        const elem = map[i][j];
                        if (elem.containsPoint(x, y)) return elem;
                    }
                }
                --i;
            }
        }

        return undefined;
    }
}
