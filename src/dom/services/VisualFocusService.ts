import type { VisualNodeMap } from "../../Types.js";
import type { DomElement } from "../DomElement.js";
import type { FocusServiceController } from "./FocusServiceController.js";

// What happens when we build the visual map.  Do we need to check if there are
// any new members that the controller needs to know about, or do we trust?

export abstract class VisualFocusService {
    protected controller: FocusServiceController;
    protected visualMap: VisualNodeMap | undefined;

    abstract buildVisualMap(controlledChildren: DomElement[]): VisualNodeMap;

    constructor(controller: FocusServiceController) {
        this.controller = controller;
    }

    public refreshVisualMap() {
        const controlledChildren = this.getControlledChildren();
        this.visualMap = this.buildVisualMap(controlledChildren);
    }

    private getControlledChildren() {
        const elems: DomElement[] = [];
        const controlledNodes = this.controller.node.controlledNodes;
        for (const node of controlledNodes) {
            elems.push(node.host);
        }
        return elems;
    }

    private getFocusedData() {
        if (this.visualMap && this.controller.focused) {
            return this.visualMap.get(this.controller.focused);
        }
    }

    // We are in a bit of a snafu...what if you do DomElement.focus(); does it
    // matter here?
    //
    // Yes - it WILL create the desired focus tree adaptations, but won't trigger
    // the focus scroll
    //
    // Since all meaningful focus changes are done on providers, and all providers
    // are controlled by controllers, then if a provider is focused, it will go
    // through its controller, which calls on the hosts _focusScrollService to
    // see the scroll change through
    private focusChild(child: DomElement | undefined) {
        if (!child) return;
        if (child === this.controller.focused) return;

        // additional check needed?? can't do it yet because DomElement is not wired in this refactor yet
        // if (this.controller.isMember(child)) {
        //     //
        // }

        child.focus();
        return child;
    }

    private getYArr() {
        return this.getFocusedData()?.yArr;
    }

    private getXArr() {
        return this.getFocusedData()?.xArr;
    }

    public focusDown(): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;
        if (data.down) {
            return this.focusChild(data.down);
        }
    }
    public focusUp(): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;
        if (data.up) {
            return this.focusChild(data.up);
        }
    }
    public focusLeft(): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;
        if (data.left) {
            return this.focusChild(data.left);
        }
    }
    public focusRight(): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;
        if (data.right) {
            return this.focusChild(data.right);
        }
    }
    public displaceDown(n = 1): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;

        return this.displaceFocus(0, Math.abs(n));
    }
    public displaceUp(n = 1): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;

        return this.displaceFocus(0, -Math.abs(n));
    }
    public displaceLeft(n = 1): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;

        return this.displaceFocus(-Math.abs(n), 0);
    }
    public displaceRight(n = 1): DomElement | undefined {
        const data = this.getFocusedData();
        if (!data) return;

        return this.displaceFocus(Math.abs(n), 0);
    }
    public focusXIdx(nextIdx: number): DomElement | undefined {
        const xArr = this.getXArr();
        if (!xArr || !xArr[nextIdx]) return;

        const prevIdx = this.getFocusedData()?.xIdx ?? 0;
        const displacement = nextIdx - prevIdx;

        return this.displaceFocus(displacement, 0);
    }
    public focusYIdx(nextIdx: number): DomElement | undefined {
        const yArr = this.getYArr();
        if (!yArr || !yArr[nextIdx]) return;

        const prevIdx = this.getFocusedData()?.yIdx ?? 0;
        const displacement = nextIdx - prevIdx;

        return this.displaceFocus(0, displacement);
    }
    public focusFirstX(): DomElement | undefined {
        const xArr = this.getXArr();
        if (!xArr || !xArr[0]) return;

        return this.focusChild(xArr[0]);
    }
    public focusFirstY(): DomElement | undefined {
        const yArr = this.getYArr();
        if (!yArr || !yArr[0]) return;

        return this.focusChild(yArr[0]);
    }
    public focusLastX(): DomElement | undefined {
        const xArr = this.getXArr();
        if (!xArr || !xArr.length) return;

        return this.focusChild(xArr[xArr.length - 1]);
    }
    public focusLastY(): DomElement | undefined {
        const yArr = this.getYArr();
        if (!yArr || !yArr.length) return;

        return this.focusChild(yArr[yArr.length - 1]);
    }
}
