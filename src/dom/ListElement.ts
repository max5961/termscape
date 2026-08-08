import { DomElement } from "./DomElement.js";
import { ElementIdentities } from "../Constants.js";
import type { VisualNodeMap } from "../Types.js";
import type { Style } from "./style/Style.js";
import type { Props } from "./props/Props.js";
import { DefaultStyles } from "./style/DefaultStyles.js";
import {
    FocusController,
    FocusStrategy,
    type IFocusController,
} from "./shared/FocusController.js";

export class ListElement
    extends DomElement<{ Style: Style.List; Props: Props.List }>
    implements IFocusController
{
    protected override readonly identities = ElementIdentities.ListElement;

    /** @internal */
    public _focusController: FocusController;

    constructor() {
        super(DefaultStyles.List);
        const strategy = new ListFocusStrategy(this);
        this._focusController = new FocusController(this, strategy);
    }

    public focusNext(units = 1) {
        return this.isLTR()
            ? this._focusController.displaceRight(units)
            : this._focusController.displaceDown(units);
    }
    public focusPrev(units = 1) {
        return this.isLTR()
            ? this._focusController.displaceLeft(units)
            : this._focusController.displaceUp(units);
    }
    public focusFirst() {
        return this.isLTR()
            ? this._focusController.focusFirstX()
            : this._focusController.focusFirstY();
    }
    public focusLast() {
        return this.isLTR()
            ? this._focusController.focusLastX()
            : this._focusController.focusLastY();
    }
    public focusIndex(idx: number) {
        return this.isLTR()
            ? this._focusController.focusXIdx(idx)
            : this._focusController.focusYIdx(idx);
    }
    public focusChild(child: DomElement) {
        return this._focusController.focusChild(child);
    }
    public getFocusedIndex(): number {
        const data = this._focusController.getFocusedData();
        return data?.xIdx || data?.yIdx || 0;
    }

    private isLTR(): boolean | undefined {
        return this.style.flexDirection?.includes("row");
    }
}

class ListFocusStrategy extends FocusStrategy {
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

// export class ListElement extends FocusManager<{
//     Style: Style.List;
//     Props: Props.List;
// }> {
//     protected override readonly identities = ElementIdentities.ListElement;
//
//     constructor() {
//         super(DefaultStyles.List);
//     }
//
//     public focusNext(units = 1) {
//         return this.isLTR() ? super.displaceRight(units) : super.displaceDown(units);
//     }
//     public focusPrev(units = 1) {
//         return this.isLTR() ? super.displaceLeft(units) : super.displaceUp(units);
//     }
//     public focusFirst() {
//         return this.isLTR() ? super.focusFirstX() : super.focusFirstY();
//     }
//     public focusLast() {
//         return this.isLTR() ? super.focusLastX() : super.focusLastY();
//     }
//     public override focusChild(child: DomElement) {
//         return super.focusChild(child);
//     }
//     public focusIndex(idx: number) {
//         return this.isLTR() ? super.focusXIdx(idx) : super.focusYIdx(idx);
//     }
//     public getFocusedIndex(): number {
//         const data = this.getFocusedData();
//         return data?.xIdx || data?.yIdx || 0;
//     }
//
//     private isLTR(): boolean | undefined {
//         return this.style.flexDirection?.includes("row");
//     }
//
//     protected override getNavigableChildren(): DomElement[] {
//         return this.children;
//     }
//
//     // CHORE - this always focuses the first appended child.  This might not be
//     // the worst, as a `startingFocus` feature could still work with minimal
//     // refactoring
//
//     protected override handleAppendChild(child: DomElement): void {
//         // In order to satisfy FocusNode dispatching focus change handlers ONLY when provider status changes, its important
//         // to make sure NOT to use _setOwnProvider here.
//         if (this._childrenManager.children.length === 1) {
//             child._becomeProvider(true);
//             this._focused = child;
//         } else {
//             child._becomeProvider(false);
//         }
//     }
//
//     protected override handleRemoveChild(
//         child: DomElement,
//         freeRecursive?: boolean,
//     ): void {
//         child._focusNode.becomeConsumer(freeRecursive);
//     }
//
//     protected override buildVisualMap(children: DomElement[], vmap: VisualNodeMap): void {
//         const isColumn = this.style.flexDirection?.includes("column");
//
//         if (!isColumn) {
//             const sortedX = children.sort((prev, curr) => {
//                 const prevStart = prev.unclippedRect?.corner.x ?? 0;
//                 const currStart = curr.unclippedRect?.corner.x ?? 0;
//                 return prevStart - currStart;
//             });
//             for (let i = 0; i < sortedX.length; ++i) {
//                 const curr = sortedX[i];
//                 const prev = sortedX[i - 1] as DomElement | undefined;
//                 const next = sortedX[i + 1] as DomElement | undefined;
//
//                 if (!vmap.has(curr)) {
//                     vmap.set(curr, {});
//                 }
//                 const data = vmap.get(curr)!;
//
//                 data.xIdx = i;
//                 data.xArr = sortedX;
//                 data.left = prev;
//                 data.right = next;
//             }
//         } else {
//             const sortedY = children.sort((prev, curr) => {
//                 const prevStart = prev.unclippedRect?.corner.y ?? 0;
//                 const currStart = curr.unclippedRect?.corner.y ?? 0;
//                 return prevStart - currStart;
//             });
//             for (let i = 0; i < sortedY.length; ++i) {
//                 const curr = sortedY[i];
//                 const prev = sortedY[i - 1] as DomElement | undefined;
//                 const next = sortedY[i + 1] as DomElement | undefined;
//
//                 if (!vmap.has(curr)) {
//                     vmap.set(curr, {});
//                 }
//                 const data = vmap.get(curr)!;
//                 data.yIdx = i;
//                 data.yArr = sortedY;
//                 data.up = prev;
//                 data.down = next;
//             }
//         }
//     }
// }
