import { type IFocusController } from "./services/focus/IFocusController.js";
import { DomElement } from "./DomElement.js";
import type { Style } from "./style/Style.js";
import type { Props } from "./props/Props.js";
import { DefaultStyles } from "./style/DefaultStyles.js";
import { ElementIdentities, LAYOUT_NODE } from "./../Constants.js";
import type { LayoutNode } from "./LayoutNode.js";
import { VisualFocusControllerService } from "./services/focus/FocusControllerService.js";

interface ILayoutElement extends IFocusController {
    focusUp(): DomElement | undefined;
    focusDown(): DomElement | undefined;
    focusLeft(): DomElement | undefined;
    focusRight(): DomElement | undefined;
    focusChild(child: LayoutNode): DomElement | undefined;
    focusById(id: string): DomElement | undefined;
}

export class LayoutElement
    extends DomElement<{ Style: Style.Layout; Props: Props.Layout }>
    implements ILayoutElement
{
    protected override identities = ElementIdentities.LayoutElement;

    public override _focusService: VisualFocusControllerService;

    constructor() {
        super(DefaultStyles.Layout);
        this._focusService = new VisualFocusControllerService(this, "2d");
    }

    public focusUp() {
        return this._focusService.focusUp();
    }
    public focusDown() {
        return this._focusService.focusDown();
    }
    public focusLeft() {
        return this._focusService.focusLeft();
    }
    public focusRight() {
        return this._focusService.focusRight();
    }
    public focusChild(child: LayoutNode) {
        return this._focusService.focusChild(child);
    }
    public focusById(id: string): DomElement | undefined {
        const controlledChildren = this._focusService.getControlledChildren();

        for (const child of controlledChildren) {
            if (child.host._getAnyProp("id") === id) {
                child.focusSelf();
                return;
            }
        }
    }

    /**
     * It is possible to append a single child that has multiple LayoutNodes.
     * */
    private handleAfterAppend(child: DomElement) {
        const blockFlexShrink = !!this._getAnyProp("blockChildrenShrink");
        this.dfs(child, (child) => {
            if (!child._is(LAYOUT_NODE)) {
                return;
            }
            // this is just ugly...the focusService should be designed to be more
            // user friendly
            if (this._focusService.node.controlledNodes.has(child._focusService.node)) {
                return;
            }

            child._shadow.blockFlexShrink(blockFlexShrink);

            // this is also ugly...bindChild should just accept a child as an argument
            // as inject the inject the service itself
            this._focusService.bindChild(child);

            if (this._focusService.node.controlledNodes.size === 1) {
                this._focusService.focusChild(child);
            }
        });
    }

    public override appendChild(child: DomElement): void {
        super.appendChild(child);
        this.handleAfterAppend(child);
    }

    public override insertBefore(child: DomElement, beforeChild: DomElement): void {
        super.insertBefore(child, beforeChild);
        this.handleAfterAppend(child);
    }

    public override removeChild(child: DomElement, freeRecursive?: boolean): void {
        this.dfs(child, (child) => {
            if (child._is(LAYOUT_NODE)) {
                this._focusService.unbindChild(child);

                if (!freeRecursive) {
                    child._shadow.blockFlexShrink(false);
                }
            }
        });
    }
}
