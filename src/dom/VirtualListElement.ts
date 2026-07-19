import type { Props } from "./props/Props.js";
import { TagNameEnum, VIRTUAL_LIST_ELEMENT } from "../Constants.js";
import { DomElement } from "./DomElement.js";
import type { Style } from "./style/Style.js";
import { IndexBuffer } from "./shared/IndexBuffer.js";
import { logger } from "../shared/Logger.js";
import type { PropEffectHandler } from "./shared/SideEffects.js";

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
    private _focusIdx: number;
    private _itemSize: number;
    private _size: number;

    constructor(initialIndex?: number) {
        super();

        initialIndex ??= 0;
        // _focusIdx should be a setter so that we can clamp it
        // or we should have a function that sets it that takes in a data array
        // so we can safely clamp it
        this._focusIdx = initialIndex;
        this.setNextFocus(initialIndex);
        this._size = 0;
        this._itemSize = 1;

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

        // When data changes, we must really track when the data change is applied
        // and we can recursively call setProp here.  Perhaps we need a _data property
        // in the class in order to have a reference of the previous data during
        // reconciliation
        this.registerPropEffect(
            "data",
            (
                ...[data, setProp, prevData]: Parameters<
                    PropEffectHandler<Props.All["data"]>
                >
            ) => {
                if (data) {
                    setProp(data);
                    this.reconcile({ prevData });
                }
            },
        );

        this.registerPropEffect(
            "getItemKey",
            (
                ...[getItemKey, setProp]: Parameters<
                    PropEffectHandler<Props.All["getItemKey"]>
                >
            ) => {
                if (getItemKey) {
                    setProp(getItemKey);
                    this.reconcile();
                }
            },
        );

        this.registerPropEffect(
            "renderItem",
            (
                ...[renderItem, setProp]: Parameters<
                    PropEffectHandler<Props.All["renderItem"]>
                >
            ) => {
                if (renderItem) {
                    setProp(renderItem);
                    this.reconcile();
                }
            },
        );

        this.registerPropEffect(
            "initialIndex",
            (
                ...[initialIndex, setProp]: Parameters<
                    PropEffectHandler<Props.All["initialIndex"]>
                >
            ) => {
                if (initialIndex) {
                    setProp(initialIndex);
                    this.reconcile();
                }
            },
        );
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
        this.setNextFocus(n);
        this.reconcile();
    }

    public focusPrev(n: number = 1) {
        this.setNextFocus(-n);
        this.reconcile();
    }

    public getFocusedIndex() {
        return this._focusIdx;
    }

    public getFocusedItem(): DomElement | undefined {
        const idx = this.getFocusedIndex();
        const buffer = this._buffer.read();
        const idxOf = buffer.indexOf(idx);
        return this._children[idxOf];
    }

    private setNextFocus(d: number) {
        const data = this.getProp("data") ?? [];
        let n = this._focusIdx + d;
        n = Math.min(n, data.length - 1);
        n = Math.max(0, n);

        this._focusIdx = n;
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

        // Get new buffer and update opts
        this._buffer.reconcile({ size: this._size, nextFocusIdx: this._focusIdx });

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
            if (dataIdx === this._focusIdx) {
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
            this.scrollDown(Infinity);
        } else if (nextFocus === this._children[0]) {
            this.scrollUp(Infinity);
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

        logger.write({ data: data.slice(0, 5) });
        return keys;
    }
}
