import type { FocusManagerProps } from "../Props.js";
import type { BoxStyle, ShadowBoxStyle } from "../style/Style.js";
import { DOM_ELEMENT_FOCUS_NODE } from "../Symbols.js";
import type { VisualNodeMap } from "../Types.js";
import type { DomElement } from "./DomElement.js";
import { FocusManager } from "./DomElement.js";

export class ListElement extends FocusManager<
    BoxStyle,
    ShadowBoxStyle,
    FocusManagerProps
> {
    public override tagName: "LIST_ELEMENT";

    constructor() {
        super();
        this.tagName = "LIST_ELEMENT";
    }

    protected override defaultStyles: BoxStyle = {
        flexDirection: "column",
        flexWrap: "nowrap",
        overflow: "scroll",
        height: "100",
        width: "100",
    };

    protected override get defaultProps(): FocusManagerProps {
        return {
            blockChildrenShrink: true,
            fallthrough: false,
            keepFocusedCenter: false,
            keepFocusedVisible: true, // TODO
        };
    }

    public focusNext(units = 1) {
        return this.isLTR() ? super.displaceRight(units) : super.displaceDown(units);
    }
    public focusPrev(units = 1) {
        return this.isLTR() ? super.displaceLeft(units) : super.displaceUp(units);
    }
    public focusFirst() {
        return this.isLTR() ? super.focusFirstX() : super.focusFirstY();
    }
    public focusLast() {
        return this.isLTR() ? super.focusLastX() : super.focusLastY();
    }
    public override focusChild(child: DomElement) {
        return super.focusChild(child);
    }
    public focusIndex(idx: number) {
        return this.isLTR() ? super.focusXIdx(idx) : super.focusYIdx(idx);
    }
    public getFocusedIndex(): number {
        const data = this.getFocusedData();
        return data?.xIdx || data?.yIdx || 0;
    }

    private isLTR(): boolean | undefined {
        return this.style.flexDirection?.includes("row");
    }

    protected override getNavigableChildren(): DomElement[] {
        return this.children.slice();
    }

    protected override handleAppendChild(child: DomElement): void {
        child[DOM_ELEMENT_FOCUS_NODE].becomeCheckpoint(false);
        if (this.children.length === 1) {
            child[DOM_ELEMENT_FOCUS_NODE].updateCheckpoint(true);
            this.focused = child;
        }

        // TODO: This needs to be dynamic so change to this value should modify
        // all existing children... It also needs to revert to its original value
        // when removing the element.
        if (this.getProp("blockChildrenShrink")) {
            child.style.flexShrink = 0;
        }
    }

    protected override handleRemoveChild(
        child: DomElement,
        freeRecursive?: boolean,
    ): void {
        child[DOM_ELEMENT_FOCUS_NODE].becomeNormal(freeRecursive);
    }

    protected override buildVisualMap(children: DomElement[], vmap: VisualNodeMap): void {
        const isColumn = this.style.flexDirection?.includes("column");

        if (!isColumn) {
            const sortedX = children.slice().sort((prev, curr) => {
                const prevStart = prev.getUnclippedRect()?.corner.x ?? 0;
                const currStart = curr.getUnclippedRect()?.corner.x ?? 0;
                return prevStart - currStart;
            });
            for (let i = 0; i < sortedX.length; ++i) {
                const curr = sortedX[i];
                const prev = sortedX[i - 1] as DomElement | undefined;
                const next = sortedX[i + 1] as DomElement | undefined;

                if (!vmap.has(curr)) {
                    vmap.set(curr, {});
                }
                const data = vmap.get(curr)!;

                data.xIdx = i;
                data.xArr = sortedX;
                data.left = prev;
                data.right = next;
            }
        } else {
            const sortedY = children.slice().sort((prev, curr) => {
                const prevStart = prev.getUnclippedRect()?.corner.y ?? 0;
                const currStart = curr.getUnclippedRect()?.corner.y ?? 0;
                return prevStart - currStart;
            });
            for (let i = 0; i < sortedY.length; ++i) {
                const curr = sortedY[i];
                const prev = sortedY[i - 1] as DomElement | undefined;
                const next = sortedY[i + 1] as DomElement | undefined;

                if (!vmap.has(curr)) {
                    vmap.set(curr, {});
                }
                const data = vmap.get(curr)!;
                data.yIdx = i;
                data.yArr = sortedY;
                data.up = prev;
                data.down = next;
            }
        }
    }
}
