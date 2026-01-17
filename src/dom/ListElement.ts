import type { VisualNodeMap } from "../Types.js";
import { DomElement } from "./DomElement.js";
import { FocusManager } from "./FocusManager.js";
import { TagNameEnum, LIST_ELEMENT } from "../Constants.js";
import type { Style } from "./style/Style.js";
import type { Props } from "./props/Props.js";

export class ListElement extends FocusManager<{
    Style: Style.List;
    Props: Props.List;
}> {
    protected static override identity = LIST_ELEMENT;

    constructor() {
        super();
    }

    public override get tagName(): typeof TagNameEnum.List {
        return "list";
    }

    protected override get defaultStyles(): Style.List {
        return {
            flexDirection: "column",
            flexWrap: "nowrap",
            overflow: "scroll",
            height: "100",
            width: "100",
        };
    }

    protected override get defaultProps(): Props.List {
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
        return this._children.slice();
    }

    // CHORE - this always focuses the first appended child.  This might not be
    // the worst, as a `startingFocus` feature could still work with minimal
    // refactoring

    protected override handleAppendChild(child: DomElement): void {
        // In order to satisfy FocusNode dispatching focus change handlers ONLY when provider status changes, its important
        // to make sure NOT to use _setOwnProvider here.
        if (this._children.length === 1) {
            child._becomeProvider(true);
            this.focused = child;
        } else {
            child._becomeProvider(false);
        }
    }

    protected override handleRemoveChild(
        child: DomElement,
        freeRecursive?: boolean,
    ): void {
        child._focusNode.becomeConsumer(freeRecursive);
    }

    protected override buildVisualMap(children: DomElement[], vmap: VisualNodeMap): void {
        const isColumn = this.style.flexDirection?.includes("column");

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
            const sortedY = children.sort((prev, curr) => {
                const prevStart = prev.unclippedRect?.corner.y ?? 0;
                const currStart = curr.unclippedRect?.corner.y ?? 0;
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
