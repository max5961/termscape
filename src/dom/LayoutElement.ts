import { FocusManager } from "./DomElement.js";
import type { DomElement, TTagNames, VisualNodeMap } from "../Types.js";
import { BoxElement } from "./BoxElement.js";
import { DOM_ELEMENT_FOCUS_NODE } from "../Symbols.js";
import type {
    VirtualStyle,
    VirtualLayoutStyle,
    ShadowLayoutStyle,
} from "../style/Style.js";
import { objectKeys } from "../Util.js";
import type { BaseProps } from "../Props.js";

export class LayoutElement extends FocusManager<
    VirtualLayoutStyle,
    ShadowLayoutStyle,
    BaseProps
> {
    public override tagName: TTagNames;

    constructor() {
        super();
        this.tagName = "LAYOUT_ELEMENT";
    }

    protected override defaultStyles: VirtualStyle = {
        flexDirection: "column",
        flexWrap: "nowrap",
        overflow: "scroll",
        height: "100",
        width: "100",
        fallthrough: false,
        keepFocusedCenter: false,
        keepFocusedVisible: true,
        blockChildrenShrink: false,
    };

    public override focusUp() {
        return super.focusUp();
    }
    public override focusDown() {
        return super.focusDown();
    }
    public override focusLeft() {
        return super.focusLeft();
    }
    public override focusRight() {
        return super.focusRight();
    }
    public override focusChild(child: LayoutNode) {
        return super.focusChild(child);
    }
    public focusById(id: string): DomElement | undefined {
        const entries = Array.from(this.visualMap.entries());
        let found: DomElement | undefined;
        for (let i = 0; i < entries.length; ++i) {
            const [elem] = entries[i];
            if (elem.getProp("id") === id) {
                found = elem;
                break;
            }
        }

        if (found) {
            return super.focusChild(found);
        }
    }

    protected override getNavigableChildren(): DomElement[] {
        const nodes: LayoutNode[] = [];

        const dfs = (child: DomElement) => {
            if (child instanceof LayoutNode) {
                nodes.push(child);
            } else {
                child.children.forEach((child) => dfs(child));
            }
        };
        this.children.forEach((child) => dfs(child));

        return nodes;
    }

    protected override handleAppendChild(child: DomElement): void {
        if (this.focused) return;

        let found = false;
        this.dfs(child, (child) => {
            if (!found && child instanceof LayoutNode) {
                child[DOM_ELEMENT_FOCUS_NODE].updateCheckpoint(true);
                this.focused = child;
                found = true;
            }
        });
    }

    protected override handleRemoveChild(
        child: DomElement,
        freeRecursive?: boolean,
    ): void {
        let found = false;
        this.dfs(child, (child) => {
            if (!found && child instanceof LayoutNode) {
                child[DOM_ELEMENT_FOCUS_NODE].becomeNormal(freeRecursive);
                found = true;
            }
        });
    }

    protected override buildVisualMap(children: DomElement[], vmap: VisualNodeMap): void {
        const xSort = this.bucketSort(
            children,
            (child) => child.getUnclippedRect()?.corner.x ?? 0,
            (child) => child.getUnclippedRect()?.corner.y ?? 0,
        );

        const ySort = this.bucketSort(
            children,
            (child) => child.getUnclippedRect()?.corner.y ?? 0,
            (child) => child.getUnclippedRect()?.corner.x ?? 0,
        );

        this.findEdges(vmap, xSort, "right", "left");
        this.findEdges(vmap, ySort, "down", "up");
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
        const cRect = curr.getUnclippedRect();
        const aRect = adj?.getUnclippedRect();
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
        const aRect = adj?.getUnclippedRect();
        const cRect = curr.getUnclippedRect();
        if (!aRect || !cRect) return false;

        if (aRect.corner.y === cRect.corner.y) return false;

        const cSpan = cRect.corner.x + cRect.width;
        const aSpan = aRect.corner.x + aRect.width;

        const fullyLeft = aSpan <= cRect.corner.x;
        const fullyRight = aRect.corner.x > cSpan;
        return !fullyLeft && !fullyRight;
    }
}

export class LayoutNode extends BoxElement {
    constructor() {
        super();
        this.focusNode.becomeCheckpoint(false);
        this.tagName = "LAYOUT_NODE";
    }
}
