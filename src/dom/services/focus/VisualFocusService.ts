import type { VisualNodeMap } from "../../../Types.js";
import { objectKeys } from "../../../Util.js";
import type { DomElement } from "../../DomElement.js";
import type { FocusControllerNode } from "./FocusControllerNode.js";

export abstract class VisualFocusService {
    protected readonly host: DomElement;
    protected readonly controller: FocusControllerNode;
    public visualMap: VisualNodeMap | undefined;

    constructor(host: DomElement, controller: FocusControllerNode) {
        this.host = host;
        this.controller = controller;
    }

    abstract buildVisualMap(controlledChildren: DomElement[]): VisualNodeMap;

    public refreshVisualMap() {
        const controlledChildren = this.getControlledChildren();
        this.visualMap = this.buildVisualMap(controlledChildren);
    }

    public getVisualData(elem?: DomElement) {
        if (elem && this.visualMap) {
            return this.visualMap.get(elem);
        }
    }

    public getFocusedVisualData() {
        return this.getVisualData(this.controller.focused?.host);
    }

    private getControlledChildren() {
        const elems: DomElement[] = [];
        const controlledNodes = this.controller.controlledNodes;
        for (const node of controlledNodes) {
            elems.push(node.host);
        }
        return elems;
    }
}

export class VisualFocusService1d extends VisualFocusService {
    constructor(host: DomElement, controller: FocusControllerNode) {
        super(host, controller);
    }

    override buildVisualMap(controlledChildren: DomElement[]): VisualNodeMap {
        const visualMap = new Map() as VisualNodeMap;
        const isColumn = this.host.style.flexDirection?.includes("column");

        if (!isColumn) {
            const sortedX = controlledChildren.sort((prev, curr) => {
                const prevStart = prev.unclippedRect?.corner.x ?? 0;
                const currStart = curr.unclippedRect?.corner.x ?? 0;
                return prevStart - currStart;
            });
            for (let i = 0; i < sortedX.length; ++i) {
                const curr = sortedX[i];
                const prev = sortedX[i - 1] as DomElement | undefined;
                const next = sortedX[i + 1] as DomElement | undefined;

                if (!visualMap.has(curr)) {
                    visualMap.set(curr, {});
                }
                const data = visualMap.get(curr)!;

                data.xIdx = i;
                data.xArr = sortedX;
                data.left = prev;
                data.right = next;
            }
        } else {
            const sortedY = controlledChildren.sort((prev, curr) => {
                const prevStart = prev.unclippedRect?.corner.y ?? 0;
                const currStart = curr.unclippedRect?.corner.y ?? 0;
                return prevStart - currStart;
            });
            for (let i = 0; i < sortedY.length; ++i) {
                const curr = sortedY[i];
                const prev = sortedY[i - 1] as DomElement | undefined;
                const next = sortedY[i + 1] as DomElement | undefined;

                if (!visualMap.has(curr)) {
                    visualMap.set(curr, {});
                }
                const data = visualMap.get(curr)!;
                data.yIdx = i;
                data.yArr = sortedY;
                data.up = prev;
                data.down = next;
            }
        }

        return visualMap;
    }
}

export class VisualFocusService2d extends VisualFocusService {
    constructor(host: DomElement, controller: FocusControllerNode) {
        super(host, controller);
    }

    override buildVisualMap(controlledChildren: DomElement[]): VisualNodeMap {
        const vmap = new Map() as VisualNodeMap;

        const xSort = this.bucketSort(
            controlledChildren,
            (child) => child.unclippedRect?.corner.x ?? 0,
            (child) => child.unclippedRect?.corner.y ?? 0,
        );

        const ySort = this.bucketSort(
            controlledChildren,
            (child) => child.unclippedRect?.corner.y ?? 0,
            (child) => child.unclippedRect?.corner.x ?? 0,
        );

        this.findEdges(vmap, xSort, "right", "left");
        this.findEdges(vmap, ySort, "down", "up");

        return vmap;
    }

    private findEdges(
        vmap: VisualNodeMap,
        sort: ReturnType<typeof this.bucketSort>,
        incEdge: "down" | "right", // in a 2d graph, moving down *increases* the *y* val...
        decEdge: "left" | "up", // and moving up decreases it
    ) {
        for (let i = 0; i < sort.bucketKeys.length; ++i) {
            const bucketIdx = sort.bucketKeys[i];
            const bucket = sort.buckets[bucketIdx];

            for (let j = 0; j < bucket.length; ++j) {
                const elem = bucket[j];

                if (!vmap.get(elem)) {
                    vmap.set(elem, {});
                }

                const adjacentFn =
                    incEdge === "right" ? this.xAdjacentValid : this.yAdjacentValid;

                // Check adj inc
                let n = i + 1;
                let foundIncEdge = false;
                while (n < sort.bucketKeys.length) {
                    const incBkIdx = sort.bucketKeys[n];
                    const incBk = sort.buckets[incBkIdx];

                    for (const incElem of incBk) {
                        if (adjacentFn(elem, incElem)) {
                            vmap.get(elem)![incEdge] = incElem;
                            foundIncEdge = true;
                            break;
                        }
                    }

                    if (foundIncEdge) break;
                    ++n;
                }

                // Check adj dec
                n = i - 1;
                let foundDecEdge = false;
                while (n >= 0) {
                    const decBkIdx = sort.bucketKeys[n];
                    const decBk = sort.buckets[decBkIdx];

                    for (const decElem of decBk) {
                        if (adjacentFn(elem, decElem)) {
                            vmap.get(elem)![decEdge] = decElem;
                            foundDecEdge = true;
                            break;
                        }
                    }

                    if (foundDecEdge) break;
                    --n;
                }
            }
        }
    }

    private bucketSort(
        children: DomElement[],
        primaryAccessor: (child: DomElement) => number,
        perpendicularAccessor: (child: DomElement) => number,
    ) {
        const buckets: Record<number, DomElement[]> = {};

        children.forEach((child) => {
            const idx = primaryAccessor(child);
            if (!buckets[idx]) {
                buckets[idx] = [];
            }
            buckets[idx].push(child);
        });

        const bucketKeys = objectKeys(buckets)
            .map(Number)
            .sort((a, b) => a - b);

        bucketKeys.forEach((key) => {
            buckets[key].sort((prev, curr) => {
                const prevStart = perpendicularAccessor(prev);
                const currStart = perpendicularAccessor(curr);
                return prevStart - currStart;
            });
        });

        return { bucketKeys, buckets };
    }

    /**
     * Checks if the *left* or *right* element according to the sorted elements array
     * is visually left or right. The adjacent element must share some *x-plane*
     * space to be considered valid.  Diagonal connections are considered invalid.
     * */
    private xAdjacentValid(curr: DomElement, adj: DomElement | undefined): boolean {
        const cRect = curr.unclippedRect;
        const aRect = adj?.unclippedRect;
        if (!aRect || !cRect) return false;

        if (aRect.corner.x === cRect.corner.x) return false;

        const cDepth = cRect.corner.y + cRect.height;
        const aDepth = aRect.corner.y + aRect.height;

        const fullyAbove = aDepth <= cRect.corner.y;
        const fullyBelow = aRect.corner.y > cDepth;
        return !fullyAbove && !fullyBelow;
    }

    /**
     * Checks if the *up* or *down* element according to the sorted elements array
     * is visually up or down. The adjacent element must share some *x-plane*
     * space to be considered valid.  Diagonal connections are considered invalid.
     * */
    private yAdjacentValid(curr: DomElement, adj: DomElement | undefined): boolean {
        const aRect = adj?.unclippedRect;
        const cRect = curr.unclippedRect;
        if (!aRect || !cRect) return false;

        if (aRect.corner.y === cRect.corner.y) return false;

        const cSpan = cRect.corner.x + cRect.width;
        const aSpan = aRect.corner.x + aRect.width;

        const fullyLeft = aSpan <= cRect.corner.x;
        const fullyRight = aRect.corner.x > cSpan;
        return !fullyLeft && !fullyRight;
    }
}
