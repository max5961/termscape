import type { Rect } from "../compositor/Canvas.js";
import type { DomElement } from "./DomElement.js";
import type { Props } from "./props/Props.js";
import { TagNameEnum, VIRTUAL_LIST_ELEMENT } from "../Constants.js";
import { AbstractList } from "./ListElement.js";

// TODO
// - override onFocus/onBlur/onShallow... so that children of VirtualList dispatch
// these handlers at the control of VirtualList and not the FocusNode which is the
// default behavior.  There should be something like a 'visited indexes' Set that is
// used to see when to dispatch these handlers.
// - test for deletion, insertion, etc..
// - test for replacing data
// - modify other classes so that appendChild, insertChild, removeChild, etc.. can be noop-able

export class VirtualList<T = any> extends AbstractList {
    protected static override identity = VIRTUAL_LIST_ELEMENT;

    public override get tagName(): typeof TagNameEnum.VirtualList {
        return "virtual-list";
    }

    /** @internal */
    public _itemSize: number;
    /** @internal */
    public _data: T[];
    /** @internal */
    public _wstart: number;
    /** @internal */
    public _wend: number;
    /** @internal */
    public _fidx: number;
    private _renderItem: Exclude<Props.VirtualList<T>["renderItem"], undefined>;
    private _explicitSize?: number;

    constructor(props: Props.VirtualList<T>) {
        super();
        this._renderItem = props.renderItem!;
        this._data = props.data!;
        this._itemSize = props.itemSize ?? 1;
        this._explicitSize = props.itemSize;
        this._fidx = 0;
        this._wstart = 0;
        this._wend = this.initWinEnd();
        this.handleVirtualChanges(0);

        this.registerPropEffect("itemSize", (v, set) => {
            this._itemSize = v ?? 1;
            set(v);
        });
        this.registerPropEffect("data", (v, set) => {
            this._data = v ?? [];
            set(v);
        });
        this.registerPropEffect("renderItem", (v, set) => {
            // Do nothing if undefined, in order to support setProp behavior which allows undefined values for everything.
            // But this is something that will need to be fixed later on...certain props should not be undefined
            if (v) {
                this._renderItem = v;
                set(v);
            }
        });

        this.afterLayout({
            subscribe: true,
            handler: () => {
                const possibleUnits = this.getIsVert()
                    ? this.visibleContentRect.height
                    : this.visibleContentRect.width;

                let didModSize = false;
                if (this._explicitSize === undefined) {
                    const nextSize = this.getIsVert()
                        ? this._children[0]?._node.getComputedHeight() ?? 1
                        : this._children[0]?._node.getComputedWidth() ?? 1;
                    didModSize = nextSize !== this._itemSize;
                    if (didModSize) this._itemSize = nextSize;
                } else if (this._itemSize !== this._explicitSize) {
                    this._itemSize = this._explicitSize;
                    didModSize = true;
                }

                return (
                    this.modifyWinSize(Math.ceil(possibleUnits / this._itemSize)) ||
                    didModSize
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
        const virFocusIdx = this._fidx - this._wstart;
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

    /** noop - use `appendVirtual` */
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
        if (this._children.length) {
            this.removeChild(this._children[this._children.length - 1], true);
        }
    }

    private shiftChild() {
        if (this._children.length) {
            this.removeChild(this._children[0], true);
        }
    }

    private getScrollOff(windowRect: Rect) {
        return this.getIsVert()
            ? this.getVertScrollOff(windowRect)
            : this.getHorizScrollOff(windowRect);
    }

    private initWinEnd() {
        return Math.min(
            this._data.length,
            this.getIsVert() ? process.stdout.rows : process.stdout.columns,
        );
    }
}
