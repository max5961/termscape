import { ElementIdentities } from "../Constants.js";
import type { VisualNodeMap } from "../Types.js";
import { DomElement } from "./DomElement.js";
import {
    FocusStrategy,
    FocusController,
    type IFocusController,
} from "./shared/FocusController.js";

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

export class FocusListElement extends DomElement implements IFocusController {
    protected override readonly identities = ElementIdentities.ListElement;

    /** @internal */
    public _focusController: FocusController;

    constructor() {
        super({});
        const strategy = new ListFocusStrategy(this);
        this._focusController = new FocusController(this, strategy);
    }

    public override appendChild(child: DomElement): void {
        if (this._getAnyProp("blockChildrenShrink")) {
            // child.style.flexShrink = child.style.flexShrink;
            // ^ this should be:
            //
            // child._shadow.blockFlexShrink(true);
            //
            // and then when removing the child
            //
            // child._shadow.blockFlexShrink(false);
            //
            // on that topic...instead of:
            // recalculateStyle(el, "height");
            // we should do something like:
            // element._virtual.computeViewport.height
        }
        super.appendChild(child);
    }

    public focusNext() {
        this._focusController.displaceDown();
    }

    public focusPrev() {
        this._focusController.displaceUp();
    }
}
