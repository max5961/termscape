import type { Style } from "./style/Style.js";
import type { Props } from "./props/Props.js";
import { ElementIdentities } from "./../Constants.js";
import { DomElement } from "./DomElement.js";
import { DefaultStyles } from "./style/DefaultStyles.js";
import type { IFocusController } from "./services/focus/IFocusController.js";
import { VisualFocusControllerService } from "./services/focus/FocusControllerService.js";

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

    public override _focusService: VisualFocusControllerService;

    constructor() {
        super(DefaultStyles.List);
        this._focusService = new VisualFocusControllerService(this, "1d");
    }

    private handleAfterAppend(child: DomElement) {
        const blockFlexShrink = !!this._getAnyProp("blockChildrenShrink");
        child._shadow.blockFlexShrink(blockFlexShrink);

        this._focusService.bindChild(child);
        if (this._treeService.children.length === 1) {
            child.focus();
        }
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
        this._focusService.unbindChild(child);
        super.removeChild(child, freeRecursive);

        if (!freeRecursive) {
            child._shadow.blockFlexShrink(false);
        }
    }

    public focusNext(units = 1) {
        // const prev = this.getFocusedChild();
        const child = this.isLTR()
            ? this._focusService.displaceRight(units)
            : this._focusService.displaceDown(units);

        return child;
    }
    public focusPrev(units = 1) {
        // const prev = this.getFocusedChild();
        const child = this.isLTR()
            ? this._focusService.displaceLeft(units)
            : this._focusService.displaceUp(units);

        // if (child) {
        //     prev._focusService.dispatchOnBlur();
        //     child._focusService.dispatchOnFocus();
        // }

        return child;
    }
    public focusFirst() {
        // const prev = this.getFocusedChild();
        const child = this.isLTR()
            ? this._focusService.focusFirstX()
            : this._focusService.focusFirstY();

        return child;
    }
    public focusLast() {
        // const prev = this.getFocusedChild();
        const child = this.isLTR()
            ? this._focusService.focusLastX()
            : this._focusService.focusLastY();

        return child;
    }
    public focusIndex(idx: number) {
        // const prev = this.getFocusedChild();
        const child = this.isLTR()
            ? this._focusService.focusXIdx(idx)
            : this._focusService.focusYIdx(idx);

        return child;
    }
    public focusChild(child: DomElement) {
        // const prev = this.getFocusedChild();
        const nextFocused = this._focusService.focusChild(child);

        return nextFocused;
    }
    public getFocusedIndex(): number {
        return this._focusService.getFocusedIndex();
    }

    private isLTR(): boolean | undefined {
        return this.style.flexDirection?.includes("row");
    }

    private getFocusedChild() {
        return this._focusService.focused;
    }
}
