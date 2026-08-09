import type { VisualNodeMap } from "./../Types.js";
import type { DomElement } from "./DomElement.js";
import { FocusStrategy } from "./services/FocusController.js";

export class ListFocusStrategy extends FocusStrategy {
    private host: DomElement;

    constructor(host: DomElement) {
        super();
        this.host = host;
    }

    public override getNavigableChildren(): DomElement[] {
        return this.host.children;
    }

    public override buildVisualMap(children: DomElement[]): VisualNodeMap {
        const visualMap = new Map() as VisualNodeMap;
        const isColumn = this.host.style.flexDirection?.includes("column");

        if (!isColumn) {
            const sortedX = children.sort((prev, curr) => {
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
            const sortedY = children.sort((prev, curr) => {
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
