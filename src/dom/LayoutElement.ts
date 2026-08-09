import { FocusController, type IFocusController } from "./services/FocusController.js";
import { DomElement } from "./DomElement.js";
import type { Style } from "./style/Style.js";
import type { Props } from "./props/Props.js";
import { DefaultStyles } from "./style/DefaultStyles.js";
import { ElementIdentities, LAYOUT_NODE } from "./../Constants.js";
import { LayoutFocusStrategy } from "./LayoutFocusStrategy.js";
import type { LayoutNode } from "./LayoutNode.js";

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

    public _focusController: FocusController;

    constructor() {
        super(DefaultStyles.Layout);
        const strategy = new LayoutFocusStrategy(this);
        this._focusController = new FocusController(this, strategy);
    }

    public focusUp() {
        return this._focusController.focusUp();
    }
    public focusDown() {
        return this._focusController.focusDown();
    }
    public focusLeft() {
        return this._focusController.focusLeft();
    }
    public focusRight() {
        return this._focusController.focusRight();
    }
    public focusChild(child: LayoutNode) {
        return this._focusController.focusChild(child);
    }
    public focusById(id: string): DomElement | undefined {
        const entries = Array.from(this._focusController.visualMap.entries());
        let found: DomElement | undefined;
        for (let i = 0; i < entries.length; ++i) {
            const [elem] = entries[i];
            if (elem.getProp("id") === id) {
                found = elem;
                break;
            }
        }

        if (found) {
            return this._focusController.focusChild(found);
        }
    }

    // This is garbage but whatever for now
    private handleAfterAppend(child: DomElement) {
        if (this._focusController.focused) return;

        let found = false;
        this.dfs(child, (child) => {
            if (!found && child._is(LAYOUT_NODE)) {
                this._focusController.focusChild(child);
                if (this._getAnyProp("blockChildrenShrink")) {
                    child._shadow.blockFlexShrink(true);
                }
                found = true;
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
        let found = false;
        this.dfs(child, (child) => {
            if (!found && child._is(LAYOUT_NODE)) {
                this._focusController.blurChild(child);
                child._becomeConsumer(freeRecursive);
                found = true;
            }
        });
    }
}
