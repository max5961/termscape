import type { Rect } from "../compositor/Canvas.js";
import type { DomElement } from "./DomElement.js";
import { VIRTUAL_LIST_ELEMENT } from "../Constants.js";
import { ListElement } from "./ListElement.js";

type VirtualListProps<T> = {
    itemSize: number;
    renderItem: (item: T, index: number) => DomElement;
    data: T[];
};

export class VirtualList<T = any> extends ListElement {
    protected static override identity = VIRTUAL_LIST_ELEMENT;

    // need to make an Abstract ListElement so that we can override tagname here

    private _data: T[];
    private _renderItem: VirtualListProps<T>["renderItem"];
    private _wstart: number;
    private _wend: number;
    private _fidx: number;

    /** @internal */
    public _itemSize: number;

    constructor(props: VirtualListProps<T>) {
        super();
        this._renderItem = props.renderItem;
        this._data = props.data;
        this._itemSize = props.itemSize;
        this._fidx = 0;
        this._wstart = 0;
        this._wend = 0;

        this.afterLayout({
            subscribe: true,
            handler: () => {
                return this.modifyWinSize(
                    this.getIsVert()
                        ? this.visibleContentRect.height
                        : this.visibleContentRect.width,
                );
            },
        });
    }

    public override focusNext(units = 1) {
        return this.handleIdxChange(this._fidx + units);
    }
    public override focusPrev(units = 1) {
        return this.handleIdxChange(this._fidx - units);
    }
    public override focusLast() {
        return this.handleIdxChange(this._data.length - 1);
    }
    public override focusFirst() {
        return this.handleIdxChange(0);
    }

    /**
     * Runs after every composite and handles any changes of the visible content rect
     * */
    private modifyWinSize(nextWinSize: number) {
        if (nextWinSize === this._wend - this._wstart) {
            return false;
        }
        if (nextWinSize === 0) {
            this._wstart = this._fidx;
            this._wend = this._fidx;
            return false;
        }

        // Always start by shifting end index as much as possible, *then* start index
        const d = this._wend - this._wstart > nextWinSize ? -1 : 1;
        while (this._wend - this._wstart !== nextWinSize) {
            if (this.isValidEnds(this._wstart, this._wend + d)) {
                this._wend += d;
            } else if (this.isValidEnds(this._wstart - d, this._wend)) {
                this._wstart -= d;
            } else {
                break;
            }
        }

        // If we've made it this far, then we need to fully refresh the children again and displace the virtual focus
        this.handleVirtualChanges(0);
        return true;
    }

    private handleVirtualChanges(winDisplace: number) {
        this.setRealChildren(winDisplace);
        this.getRoot()?._refreshLayout();
        return this.handleFocusChange();
    }

    private getCurrFocus(): DomElement | undefined {
        const fromEnd = this._wend - this._fidx;
        const virFocusIdx = this._children.length - fromEnd;
        return this._children[virFocusIdx];
    }

    private handleFocusChange() {
        const item = this.getCurrFocus();
        if (item) {
            return this.focusChild(item);
        }
        return undefined;
    }

    private handleIdxChange(nextIdx: number) {
        const wRect = this.getWindowRect();
        const fRect = this.getFocusItemRect();
        if (!wRect || !fRect) return;

        // Clamp nextIdx
        if (nextIdx < 0) {
            nextIdx = Math.max(0, nextIdx);
        }
        if (nextIdx >= this._data.length) {
            nextIdx = Math.min(this._data.length - 1, nextIdx);
        }

        const scrollOff = this.getScrollOff(wRect);
        const focusDir = nextIdx > this._fidx ? +1 : -1;
        this._fidx = nextIdx;

        const sowend = Math.min(
            this._data.length,
            focusDir > 0 ? this._wend - scrollOff : this._wend,
        );
        const sowstart = Math.max(
            0,
            focusDir < 0 ? this._wstart + scrollOff : this._wstart,
        );

        let winDisplace = 0;
        if (nextIdx < sowstart) {
            winDisplace = nextIdx - sowstart;
            if (this._wstart + winDisplace < 0) {
                winDisplace = -this._wstart;
            }
        } else if (nextIdx >= sowend) {
            winDisplace = nextIdx - sowend + 1;
            if (this._wend + winDisplace > this._data.length) {
                winDisplace = this._data.length - this._wend;
            }
        }

        if (!winDisplace) {
            return this.handleFocusChange();
        }

        this._wstart += winDisplace;
        this._wend += winDisplace;

        // One downside of this is it makes perforance tracking more difficult since this does a layout composite pass before
        // the actual rendering cycle.
        return this.handleVirtualChanges(winDisplace);
    }

    /**
     * @param winDisplace if 0 a full refresh is done, otherwise negative winDisplace indicates that we need to remove winDisplace units
     * from the start and replace while positive winDisplace indicates the opposite
     * */
    private setRealChildren(winDisplace: number) {
        if (!winDisplace || Math.abs(winDisplace) >= this._wend - this._wstart) {
            return this.fullWipeChildren();
        } else if (winDisplace < 0) {
            return this.setNegativeDisplacedChildren(winDisplace);
        } else {
            return this.setPositiveDisplacedChildren(winDisplace);
        }
    }

    private fullWipeChildren() {
        const elements: DomElement[] = [];
        for (let i = this._wstart; i < this._wend; ++i) {
            if (i < this._data.length && i >= 0) {
                elements.push(this._renderItem(this._data[i], i));
            }
        }
        return this.replaceChildren(...elements);
    }

    private setNegativeDisplacedChildren(winDisplace: number) {
        for (let i = 0; i > winDisplace; --i) this.popChild();
        for (let i = winDisplace + 1; i <= 0; ++i) {
            const adj = this._wstart - i;
            this.insertBefore(this._renderItem(this._data[adj], adj), this._children[0]);
        }
    }

    private setPositiveDisplacedChildren(winDisplace: number) {
        for (let i = 0; i < winDisplace; ++i) this.shiftChild();
        for (let i = winDisplace; i >= 1; --i) {
            const adj = this._wend - i;
            this.appendChild(this._renderItem(this._data[adj], adj));
        }
    }

    public setData(_d: T[]) {
        // force a nuclear delete, create, append on all children
        // attempt to keep same index slices
        //
        // If only the array length changes, we can't just assume that it was a simple append or delete
        // operation.  It always could be an operation that changes the entire data.
    }

    /**
     * @internal
     * Still allow .splice() only changes in dom layer with setData, but adhere to React
     * immutability in vdom. In vdom, we pipe all state into _setDataStrict so we don't want to
     * refresh all children unless the state slice actually changes.
     * */
    public _setDataStrict(d: T[]) {
        if (this._data !== d) this.setData(d);
    }

    // /** noop - use `appendVirtual` */
    // public override appendChild(_child: DomElement): void {}
    // /** noop - use `removeVirtual` */
    // public override removeChild(_child: DomElement, _freeRecursive?: boolean): void {}
    // /** noop - use `insertVirtual` */
    // public override insertBefore(_child: DomElement, _beforeChild: DomElement): void {}

    // For all of these, decide how they _data will be hanlded once changes are made
    public appendVirtual(data: T): void {
        this._data.push(data);
    }
    public insertVirtual(data: T, beforeIndex: number): void {
        this._data.splice(beforeIndex, 0, data);
    }
    public removeVirtual(data: T): void {
        const i = this._data.indexOf(data);
        if (i >= 0) {
            this._data.splice(i, 1);
        }
    }

    private isValidEnds = (start: number, end: number): boolean => {
        if (start < 0) return false;
        if (start > end) return false;
        if (end < 0) return false;
        if (end > this._data.length) return false;
        if (start > this._fidx) return false;
        if (end <= this._fidx) return false;
        return true;
    };

    private getIsVert() {
        return this.style.flexDirection?.includes("column");
    }

    private popChild() {
        this.destroyChild(this._children[this._children.length - 1]);
    }

    private shiftChild() {
        this.destroyChild(this._children[0]);
    }

    private getScrollOff(windowRect: Rect) {
        return this.getIsVert()
            ? this.getVertScrollOff(windowRect)
            : this.getHorizScrollOff(windowRect);
    }
}
