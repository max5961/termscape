import type { Props } from "./props/Props.js";
import type { Style } from "./style/Style.js";
import { TagNameEnum, VIRTUAL_LIST_ELEMENT } from "../Constants.js";
import { DomElement } from "./DomElement.js";
import { IndexBuffer } from "./shared/IndexBuffer.js";
import { logger } from "../shared/Logger.js";

// - override onFocus/onBlur/onShallow... so that children of VirtualList dispatch
// these handlers at the control of VirtualList and not the FocusNode which is the
// default behavior.  There should be something like a 'visited indexes' Set that is
// used to see when to dispatch these handlers.
//
// - modify other classes so that appendChild, insertChild, removeChild, etc.. can be noop-able

export class VirtualListElement<T = any> extends DomElement<{
    Style: Style.VirtualList;
    Props: Props.VirtualList<T>;
}> {
    protected static override identity = VIRTUAL_LIST_ELEMENT;

    /** @internal */
    public _buffer: IndexBuffer;
    private _focusState: FocusState;
    private _itemSize: number;
    private _size: number;

    constructor(initialIndex?: number) {
        super();
        this._size = 0;
        this._itemSize = 1;
        this._focusState = new FocusState([], initialIndex ?? 0);
        this._buffer = new IndexBuffer(this);

        this.reconcile();

        this.afterLayout({
            subscribe: true,
            handler: () => {
                const prevItemSize = this._itemSize;
                const nextItemSize = Math.max(
                    1,
                    this._children[0]?.unclippedRect.height ?? prevItemSize,
                );

                const prevSize = this._size;
                // const nextSize = this.visibleContentRect.height;
                const nextSize = Math.ceil(this.visibleContentRect.height / nextItemSize);

                if (prevSize !== nextSize || prevItemSize !== nextItemSize) {
                    this._size = nextSize;
                    this._itemSize = nextItemSize;
                    this.reconcile();
                    return true;
                }
                return false;
            },
        });

        const props: (keyof Props.All)[] = [
            "data",
            "getItemKey",
            "renderItem",
            "initialIndex",
        ];

        props.forEach((p) => {
            this.registerPropEffect(p, (next, _setProp, prev) => {
                if (p === "data") {
                    // this.setNextFocus(this._focusIdx);
                    this._focusState.data = next as T[];
                    this.reconcile({ prevData: (prev as T[]) ?? [] });
                } else {
                    this.reconcile();
                }
            });
        });
    }

    public override get tagName(): typeof TagNameEnum.VirtualListElement {
        return "virtual-list";
    }

    protected override get defaultProps(): Props.All {
        return {
            offset: 0,
            initialIndex: 0,
            expandStrategy: "fillEnd",
            compressStrategy: "clipEnd",
        };
    }

    protected override get defaultStyles(): Style.All {
        return {
            flexDirection: "column",
            overflow: "scroll",
        };
    }

    public focusNext(n: number = 1) {
        this._focusState.incrementFocus(n);
        this.reconcile();
    }

    public focusPrev(n: number = 1) {
        this._focusState.decrementFocus(n);
        this.reconcile();
    }

    public getFocusedIndex() {
        return this._focusState.focusIdx;
    }

    private getFocusChangeDirection() {
        return this._focusState.changeDirection;
    }

    public getFocusedItem(): DomElement | undefined {
        const idx = this.getFocusedIndex();
        const buffer = this._buffer.read();
        const idxOf = buffer.indexOf(idx);
        return this._children[idxOf];
    }

    private reconcile(opts: { prevData: undefined | any[] } = { prevData: undefined }) {
        // Handle previous
        const prevIndexBuf = this._buffer.read();
        const prevKeys = this.createKeys(
            prevIndexBuf,
            opts.prevData ?? this.getProp("data") ?? [],
        );
        const prevMap = new Map<string, DomElement>();

        let prevFocus: DomElement | undefined = undefined;
        for (let i = 0; i < prevIndexBuf.length; ++i) {
            const key = prevKeys[i];
            const el = this._children[i];
            if (el) {
                prevMap.set(key, el);
                if (el.getFocus()) {
                    prevFocus = el;
                }
            }
        }

        // this should be Math.ceil eventually
        this._size = Math.ceil(
            (this.visibleContentRect.height ?? this._size) / Math.max(1, this._itemSize),
        );

        this._buffer.reconcile({
            data: this.getProp("data") ?? [],
            bufferSize: this._size,
            focusIdx: this.getFocusedIndex(),
            focusChangeDirection: this.getFocusChangeDirection(),
        });

        // Handle next
        const nextIndexBuf = this._buffer.read();
        const nextKeys = this.createKeys(nextIndexBuf, this.getProp("data") ?? []);
        const nextMap = new Map<string, DomElement>();

        let nextFocus: DomElement | undefined = undefined;
        for (let i = 0; i < nextIndexBuf.length; ++i) {
            const dataIdx = nextIndexBuf[i];
            const key = nextKeys[i];
            const data = this.getProp("data");
            const renderItem = this.getProp("renderItem");
            if (!data || !renderItem) continue;

            const el = prevMap.get(key) ?? renderItem(data[dataIdx], dataIdx);
            nextMap.set(key, el);
            if (dataIdx === this.getFocusedIndex()) {
                nextFocus = el;
            }
        }

        // Check for diff
        if (
            prevKeys.length === nextKeys.length &&
            prevKeys.every((k, i) => nextKeys[i] === k)
        ) {
            if (prevFocus !== nextFocus) {
                prevFocus?._becomeProvider(false);
                prevFocus?._setOwnProvider(false);
                nextFocus?._becomeProvider(true);
                nextFocus?._setOwnProvider(true);
            }
        } else {
            // If diff, then remove and replace children
            const children = [...this._children];
            children.forEach((c) => this.removeChild(c));
            nextKeys.forEach((k) => {
                const el = nextMap.get(k);
                if (el) {
                    this.appendChild(el);
                    el._becomeProvider(el === nextFocus);
                    el._setOwnProvider(el === nextFocus);
                }
            });
        }

        if (nextFocus === this._children[this._children.length - 1]) {
            // this.scrollDown(Infinity);
        } else if (nextFocus === this._children[0]) {
            // this.scrollUp(Infinity);
        }
    }

    private createKeys(indexBuf: number[], data: any[]) {
        const getItemKey = this.getProp("getItemKey");
        if (!getItemKey) return [];

        const keys = [] as string[];
        for (let i = 0; i < indexBuf.length; ++i) {
            const dataIdx = indexBuf[i];
            keys.push(getItemKey(data[dataIdx]));
        }

        return keys;
    }
}

class FocusState {
    private _data: any[];
    private _idx: number;
    private _initialIdx: number;
    private _changeDirection: -1 | 1 | 0;

    constructor(data: any[], initialIndex: number) {
        this._data = data;
        this._idx = initialIndex;
        this._initialIdx = initialIndex;
        this._changeDirection = 0;
    }

    public incrementFocus(steps = 1) {
        return this.moveFocus(steps);
    }

    public decrementFocus(steps = 1) {
        return this.moveFocus(-steps);
    }

    public get focusIdx() {
        return this._idx;
    }

    public get changeDirection() {
        return this._changeDirection;
    }

    public set data(data: any[]) {
        this._data = data;
        this.moveFocus(0);
    }

    private moveFocus(steps: number) {
        const prev = this._idx;
        const next = this.clampNextFocus(this._idx + steps);
        this.updateChangeDirection(prev, next);
        this._idx = next;
        return this._idx;
    }

    public moveFocusToIndex(i: number) {
        const steps = i - this._idx;
        return this.moveFocus(steps);
    }

    /**
     * Because the class uses props to track data, the class may not have the
     * data available until after construction, so this is a side effect we need
     * to run after data has been set the first time.
     * */
    public moveFocusToInitialIndex() {
        this.moveFocusToIndex(this._initialIdx);
    }

    private clampNextFocus(next: number) {
        next = Math.min(next, this._data.length - 1);
        next = Math.max(0, next);
        return next;
    }

    private updateChangeDirection(prevIdx: number, nextIdx: number) {
        this._changeDirection = prevIdx < nextIdx ? +1 : prevIdx > nextIdx ? -1 : 0;
    }
}
