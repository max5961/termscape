import { FocusService } from "./FocusService.js";
import { FocusControllerNode } from "./FocusControllerNode.js";
import { DomElement } from "../../DomElement.js";
import {
    VisualFocusService1d,
    VisualFocusService2d,
    type VisualFocusService,
} from "./VisualFocusService.js";
import { FocusScrollerService } from "./FocusScrollerService.js";

export abstract class FocusControllerService extends FocusService {
    protected focusScrollerService: FocusScrollerService;

    protected override _node: FocusControllerNode;
    public override get node(): FocusControllerNode {
        return this._node;
    }

    constructor(host: DomElement) {
        super(host);
        this._node = new FocusControllerNode(host, this);
        this.focusScrollerService = new FocusScrollerService(host);
    }

    public abstract handleFocusChange(
        prev: DomElement | undefined,
        next: DomElement,
    ): DomElement | undefined;

    public get focused() {
        return this._node.focused?.host;
    }

    /**
     * Has the intended side effect of setting child focus to false.  The focused
     * child must be explicitly set.
     *
     * When focusing a child, DomElement.focus() works as it will check to see if
     * there is a FocusControllerNode and if there is it will unfocus the focused
     * node under the controller (if exists) before focusing the child and making
     * the child the focused node in the set of nodes controlled by the controller
     * */
    public bindChild(child: DomElement) {
        this._node.bindChild(child._focusService.node);
    }

    public unbindChild(child: DomElement) {
        this._node.unbindChild(child._focusService.node);
    }

    public override removeFocusNodeChild(child: FocusService): void {
        super.removeFocusNodeChild(child);
        this._node.unbindChild(child.node);
    }

    public adjustOffsetToFocus() {
        return this.focusScrollerService.adjustOffsetToFocus();
    }

    public getControlledChildren() {
        return this._node.controlledNodes;
    }
}

export class VisualFocusControllerService extends FocusControllerService {
    private visualFocusService: VisualFocusService;

    constructor(host: DomElement, mode: "1d" | "2d") {
        super(host);
        this.visualFocusService =
            mode === "1d"
                ? new VisualFocusService1d(host, this._node)
                : new VisualFocusService2d(host, this._node);
    }

    public refreshVisualMap() {
        this.visualFocusService.refreshVisualMap();
    }

    public override handleFocusChange(prev: DomElement | undefined, next: DomElement) {
        const prevData = this.visualFocusService.getVisualData(prev);
        const nextData = this.visualFocusService.getVisualData(next);

        const prevX = prevData?.xIdx ?? 0;
        const prevY = prevData?.yIdx ?? 0;
        const nextX = nextData?.xIdx ?? 0;
        const nextY = nextData?.yIdx ?? 0;
        const dx = nextX - prevX;
        const dy = nextY - prevY;

        this.focusScrollerService.scrollToFitFocus(
            dx < 0 ? "left" : dx > 0 ? "right" : dy < 0 ? "up" : "down",
        );

        return this.focused;
    }

    public focusChild(child: DomElement | undefined) {
        child?.focus();
        return child;
    }

    public getFocusedIndex() {
        const data = this.visualFocusService.getFocusedVisualData();
        return data?.yIdx || data?.xIdx || 0;
    }

    public focusDown(): DomElement | undefined {
        const data = this.visualFocusService.getFocusedVisualData();
        if (!data) return;
        if (data.down) {
            return this.focusChild(data.down);
        }
    }
    public focusUp(): DomElement | undefined {
        const data = this.visualFocusService.getFocusedVisualData();
        if (!data) return;
        if (data.up) {
            return this.focusChild(data.up);
        }
    }
    public focusLeft(): DomElement | undefined {
        const data = this.visualFocusService.getFocusedVisualData();
        if (!data) return;
        if (data.left) {
            return this.focusChild(data.left);
        }
    }
    public focusRight(): DomElement | undefined {
        const data = this.visualFocusService.getFocusedVisualData();
        if (!data) return;
        if (data.right) {
            return this.focusChild(data.right);
        }
    }
    public displaceDown(n = 1): DomElement | undefined {
        const data = this.visualFocusService.getFocusedVisualData();
        if (!data) return;

        return this.displaceFocus(0, Math.abs(n));
    }
    public displaceUp(n = 1): DomElement | undefined {
        const data = this.visualFocusService.getFocusedVisualData();
        if (!data) return;

        return this.displaceFocus(0, -Math.abs(n));
    }
    public displaceLeft(n = 1): DomElement | undefined {
        const data = this.visualFocusService.getFocusedVisualData();
        if (!data) return;

        return this.displaceFocus(-Math.abs(n), 0);
    }
    public displaceRight(n = 1): DomElement | undefined {
        const data = this.visualFocusService.getFocusedVisualData();
        if (!data) return;

        return this.displaceFocus(Math.abs(n), 0);
    }
    public focusXIdx(nextIdx: number): DomElement | undefined {
        const xArr = this.getFocusedXArr();
        if (!xArr || !xArr[nextIdx]) return;

        const prevIdx = this.visualFocusService.getFocusedVisualData()?.xIdx ?? 0;
        const displacement = nextIdx - prevIdx;

        return this.displaceFocus(displacement, 0);
    }
    public focusYIdx(nextIdx: number): DomElement | undefined {
        const yArr = this.getFocusedYArr();
        if (!yArr || !yArr[nextIdx]) return;

        const prevIdx = this.visualFocusService.getFocusedVisualData()?.yIdx ?? 0;
        const displacement = nextIdx - prevIdx;

        return this.displaceFocus(0, displacement);
    }
    public focusFirstX(): DomElement | undefined {
        const xArr = this.getFocusedXArr();
        if (!xArr || !xArr[0]) return;

        return this.focusChild(xArr[0]);
    }
    public focusFirstY(): DomElement | undefined {
        const yArr = this.getFocusedYArr();
        if (!yArr || !yArr[0]) return;

        return this.focusChild(yArr[0]);
    }
    public focusLastX(): DomElement | undefined {
        const xArr = this.getFocusedXArr();
        if (!xArr || !xArr.length) return;

        return this.focusChild(xArr[xArr.length - 1]);
    }
    public focusLastY(): DomElement | undefined {
        const yArr = this.getFocusedYArr();
        if (!yArr || !yArr.length) return;

        return this.focusChild(yArr[yArr.length - 1]);
    }

    private getFocusedYArr() {
        return this.visualFocusService.getFocusedVisualData()?.yArr;
    }

    private getFocusedXArr() {
        return this.visualFocusService.getFocusedVisualData()?.xArr;
    }

    private displaceFocus(dx: number, dy: number): DomElement | undefined {
        const data = this.visualFocusService.getFocusedVisualData();
        if (!data) return;
        if (!dx && !dy) return;

        const applyDisplacement = (d: number, idx?: number, arr?: DomElement[]) => {
            if (!arr || idx === undefined) return;

            let next = idx + d;

            if (this.host._getAnyProp("fallthrough")) {
                if (next < 0) {
                    next = arr.length - 1;
                } else if (next > arr.length - 1) {
                    next = 0;
                }
            }

            if (d < 0) {
                next = Math.max(0, next);
            } else {
                next = Math.min(arr.length - 1, next);
            }

            this.focusChild(arr[next]);
            return arr[next];
        };

        const result = dx
            ? applyDisplacement(dx, data.xIdx, data.xArr)
            : applyDisplacement(dy, data.yIdx, data.yArr);

        return result;
    }
}

export class VirtualFocusControllerService extends FocusControllerService {
    constructor(host: DomElement) {
        super(host);
    }

    public override handleFocusChange(
        _prev: DomElement | undefined,
        next: DomElement,
    ): DomElement | undefined {
        return next;
    }
}
