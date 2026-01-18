import { stdout } from "process";
import { VIRTUAL_LIST_ELEMENT } from "../Constants.js";
import { logger } from "../shared/Logger.js";
import type { DomElement } from "./DomElement.js";
import { ListElement } from "./ListElement.js";

type VirtualListProps<T> = {
    renderItem: (item: T, index: number) => DomElement;
    data: T[];
};

export class VirtualList<T = any> extends ListElement {
    protected static override identity = VIRTUAL_LIST_ELEMENT;

    // need to make an Abstract ListElement so that we can override tagname here

    private _data: T[];
    private _renderItem: VirtualListProps<T>["renderItem"];
    private _maxwin: number;
    private _wstart: number;
    private _wend: number;
    private _focusedIdx: number;

    constructor(props: VirtualListProps<T>) {
        super();
        this._renderItem = props.renderItem;
        this._data = props.data;
        this._maxwin = this.getMaxWin();
        this._wstart = 0;
        this._wend = this._maxwin;
        this._focusedIdx = this._wstart;
        this.setRealChildren(0);
    }

    private popChild() {
        this.destroyChild(this._children[this._children.length - 1]);
    }

    private shiftChild() {
        this.destroyChild(this._children[0]);
    }

    private handleIdxChange(nextIdx: number) {
        if (nextIdx < 0) nextIdx = Math.max(0, nextIdx);
        if (nextIdx >= this._data.length)
            nextIdx = Math.min(this._data.length - 1, nextIdx);

        const wRect = this.getWindowRect();
        const fRect = this.getFocusItemRect();
        if (!wRect || !fRect) return;

        const flexDir = this.style.flexDirection?.includes("row") ? "h" : "v";
        const scrollOff =
            flexDir === "v"
                ? this.getVertScrollOff(wRect)
                : this.getHorizScrollOff(wRect);

        const focusDir = nextIdx > this._focusedIdx ? +1 : -1;
        this._focusedIdx = nextIdx;

        const sowend = Math.min(
            this._data.length,
            focusDir > 0 ? this._wend - scrollOff : this._wend,
        );
        const sowstart = Math.max(
            0,
            focusDir < 0 ? this._wstart + scrollOff : this._wstart,
        );

        let displacement = 0;
        if (nextIdx < sowstart) {
            displacement = nextIdx - sowstart;
            logger.write({ displacement });
            if (this._wstart + displacement < 0) {
                displacement = -this._wstart;
            }
        } else if (nextIdx >= sowend) {
            displacement = nextIdx - sowend + 1;
            if (this._wend + displacement > this._data.length) {
                displacement = this._data.length - this._wend;
            }
        }

        if (!displacement) {
            return this.handleFocusChange();
        }

        this._wstart += displacement;
        this._wend += displacement;
        this.setRealChildren(displacement);

        // Unfortunately, this must be an after layout hook.  If we recalculated yg and refreshed the visual map that isn't enough
        // because we still need to make sure the content depths are refreshed as well. It is a double composite pass unless you add
        // a quick pass before compositing where nothing is done except calculating depths and refreshing vis maps.
        this.afterLayout({
            subscribe: false,
            handler: () => {
                this.handleFocusChange();
                return true;
            },
        });
    }

    /**
     * @param displace if 0 a full refresh is done, otherwise negative displace indicates that we need to remove displace units
     * from the start and replace while positive displace indicates the opposite
     * */
    private setRealChildren(displace: number) {
        const elements: DomElement[] = [];
        if (!displace || Math.abs(displace) >= this._wend - this._wstart) {
            for (let i = this._wstart; i < this._wend; ++i) {
                if (i < this._data.length && i >= 0) {
                    elements.push(this._renderItem(this._data[i], i));
                }
            }
            return this.replaceChildren(...elements);
        }

        if (displace < 0) {
            for (let i = 0; i > displace; --i) this.popChild();
            for (let i = displace + 1; i <= 0; ++i) {
                const adj = this._wstart - i;
                this.insertBefore(
                    this._renderItem(this._data[adj], adj),
                    this._children[0],
                );
            }
        } else {
            for (let i = 0; i < displace; ++i) this.shiftChild();
            for (let i = displace; i >= 1; --i) {
                const adj = this._wend - i;
                this.appendChild(this._renderItem(this._data[adj], adj));
            }
        }
    }

    private handleFocusChange() {
        const fromEnd = this._wend - this._focusedIdx;
        const virFocusIdx = this._children.length - fromEnd;
        const item = this._children[virFocusIdx];

        return this.focusChild(item);
    }

    public override focusNext(units = 1) {
        return this.handleIdxChange(this._focusedIdx + units);
    }

    public override focusPrev(units = 1) {
        return this.handleIdxChange(this._focusedIdx - units);
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

    private getMaxWin(): number {
        const isColumn = this.style.flexDirection?.includes("column");
        let stdoutMax = 0;
        if (isColumn) {
            stdoutMax = 1 + (this.getRoot()?.runtime.stdout.rows ?? process.stdout.rows);
        } else {
            stdoutMax =
                1 + (this.getRoot()?.runtime.stdout.columns ?? process.stdout.columns);
        }
        return Math.min(this._data.length, stdoutMax);
    }
}

// private handleIdxChange(nextIdx: number) {
//     if (nextIdx < 0 || nextIdx >= this._data.length) return;
//
//     let displacement = 0;
//     if (nextIdx < this._winstart) {
//         displacement = -(this._winstart - nextIdx);
//     }
//     if (nextIdx >= this._winend) {
//         displacement = nextIdx - this._winend + 1;
//     }
//
//     if (!displacement) {
//         this._focusedIdx = nextIdx;
//         return this.handleFocusChange();
//     }
//
//     this._winstart += displacement;
//     this._winend += displacement;
//     this._focusedIdx = nextIdx;
//     return this.handleSliceChange();
// }
//
// private handleSliceChange() {
//     this.updateRealChildren();
//     return this.handleFocusChange();
// }
//
// private handleFocusChange() {
//     const fromEnd = this._winend - this._focusedIdx;
//     const virFocusIdx = this._generatedItems.length - fromEnd;
//     const item = this._generatedItems[virFocusIdx];
//     return this.focusChild(item);
// }
//
// private updateRealChildren(): void {
//     this._generatedItems = [];
//
//     for (let i = this._winstart; i < this._winend; ++i) {
//         const dataItem = this._data[i];
//         if (dataItem) {
//             this._generatedItems.push(this._renderItem(dataItem));
//         }
//     }
//
//     // This is where FocusManager is 'picking' an index to focus and running
//     // focusChild automatically, see 'FocusManager.removeChild' which checks to
//     // see if the child being removed is focused, if it is then it shifts focus
//     [...this._children].forEach((child) => this.removeChild(child));
//     this._generatedItems.forEach((child) => this.appendChild(child));
//
//     // The real issue with this design is that once you remove or add a child
//     // you need to refresh the visual map to be safe. For the first render, this
//     // shouldn't really be an issue because there is no stdin to manipulate the
//     // list.  However, to ultimately be **safe**, it you may need to refresh
//     // the vmap on every tree manip and that could end up with a lot of redundancy
//     this.refreshVisualMap();
// }
//
// private getMaxWin(): void {
//     const rows = this.getRoot()?.runtime.stdout.rows ?? 0;
//     const cols = this.getRoot()?.runtime.stdout.columns ?? 0;
//     const isColumn = this.style.flexDirection?.includes("column");
//     const max = Math.max(
//         rows,
//         cols,
//         isColumn
//             ? this.getRoot()?.runtime.stdout.rows ?? process.stdout.rows
//             : this.getRoot()?.runtime.stdout.columns ?? process.stdout.columns,
//     );
//
//     this._winend = this._winstart + max + 1;
// }
//
// public override focusNext(units = 1) {
//     return this.handleIdxChange(this._focusedIdx + units);
// }
//
// public override focusPrev(units = 1) {
//     return this.handleIdxChange(this._focusedIdx - units);
// }
