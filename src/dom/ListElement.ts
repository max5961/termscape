import type { Style } from "./style/Style.js";
import type { Props } from "./props/Props.js";
import { ElementIdentities } from "./../Constants.js";
import { DomElement } from "./DomElement.js";
import { FocusController, type IFocusController } from "./shared/FocusController.js";
import { DefaultStyles } from "./style/DefaultStyles.js";
import { ListFocusStrategy } from "./ListFocusStrategy.js";

interface IListElement extends IFocusController {
    focusNext(units: number): DomElement | undefined;
    focusPrev(units: number): DomElement | undefined;
    focusFirst(): DomElement | undefined;
    focusLast(): DomElement | undefined;
    focusIndex(idx: number): DomElement | undefined;
    focusChild(child: DomElement): DomElement | undefined;
    getFocusedIndex(): number;
}

export class ListElement
    extends DomElement<{ Style: Style.List; Props: Props.List }>
    implements IListElement
{
    protected override readonly identities = ElementIdentities.ListElement;

    public _focusController: FocusController;

    constructor() {
        super(DefaultStyles.List);
        const strategy = new ListFocusStrategy(this);
        this._focusController = new FocusController(this, strategy);
    }

    private handleAfterAppend(child: DomElement) {
        // In order to satisfy FocusNode dispatching focus change handlers ONLY when provider status changes, its important
        // to make sure NOT to use _setOwnProvider here.
        //
        // ^ which is what we are doing right now but we will have to fix this later

        const children = this._childrenManager.children;
        if (children.length === 1) {
            this._focusController.focusChild(child);
        } else {
            this._focusController.blurChild(child);
        }

        // recalculate flex shrink
        child._shadow.blockFlexShrink(!!this._getAnyProp("blockChildrenShrink"));
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
        this._focusController.blurChild(child);

        super.removeChild(child, freeRecursive);

        if (!freeRecursive) {
            child._shadow.blockFlexShrink(false);
        }
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
