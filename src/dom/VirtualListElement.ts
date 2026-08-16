import { ElementIdentities } from "../Constants.js";
import { DomElement } from "./DomElement.js";
import type { Props } from "./props/Props.js";
import { VirtualFocusControllerService } from "./services/focus/FocusControllerService.js";
import type { IFocusController } from "./services/focus/IFocusController.js";
import { DefaultStyles } from "./style/DefaultStyles.js";
import type { Style } from "./style/Style.js";

export class VirtualListElement<T = any>
    extends DomElement<{ Style: Style.VirtualList; Props: Props.VirtualList<T> }>
    implements IFocusController
{
    protected override identities = ElementIdentities.VirtualListElement;

    public override _focusService: VirtualFocusControllerService;
    private buffer: IndexBuffer;
    private indexTracker: FocusIndexTracker;
    private currentKeyedElements: Map<string, DomElement>;
    private sizing: { itemSize: number; bufferSize: number };

    constructor(initialIndex?: number) {
        super(DefaultStyles.VirtualList);
        this._focusService = new VirtualFocusControllerService(this);
        this.buffer = new IndexBuffer(this);
        this.indexTracker = new FocusIndexTracker([], initialIndex ?? 0);
        this.currentKeyedElements = new Map();
        this.sizing = {
            itemSize: 1,
            bufferSize: 0,
        };
        // @ts-ignore LOL this is necessary for adjustOffsetToFocus to not return early.  This will need to be fixed in a later refactor
        this._scrollService._lastOffsetChangeWasFocus = true;

        // Handle content size changes or item size changes
        this.afterLayout({
            subscribe: true,
            handler: () => {
                const prev = this.sizing;
                const next = this.getSizing();

                if (
                    prev.itemSize !== next.itemSize ||
                    prev.bufferSize !== next.bufferSize
                ) {
                    this.sizing = next;
                    this.reconcile();
                    return true;
                }

                return false;
            },
        });

        let initChildDimensions = false;
        this.afterLayout({
            subscribe: true,
            handler: () => {
                if (initChildDimensions) return false;

                const child = this.firstElementChild;
                if (child) {
                    initChildDimensions = child.hasComposedCanvas;

                    if (initChildDimensions) {
                        this.sizing = this.getSizing();
                        this.reconcile();
                    }
                }
                return initChildDimensions;
            },
        });

        this.afterLayout({
            subscribe: true,
            handler: () => {
                return this._focusService.adjustOffsetToFocus();
            },
        });

        (
            ["data", "getItemKey", "renderItem", "initialIndex"] as (keyof Props.All)[]
        ).forEach((p) => {
            this.registerPropEffect(p, (next) => {
                if (p === "data") {
                    this.indexTracker.data = next as T[];
                    this.indexTracker.incrementFocus(0);
                    this.reconcile();
                } else {
                    this.reconcile();
                }
            });
        });
    }

    /** @internal */
    public _getBuffer() {
        return this.buffer;
    }

    public focusNext(n: number = 1) {
        this.indexTracker.incrementFocus(n);
        this.reconcile();
    }

    public focusPrev(n: number = 1) {
        this.indexTracker.decrementFocus(n);
        this.reconcile();
    }

    public focusIndex(i: number) {
        this.indexTracker.moveFocusToIndex(i);
        this.reconcile();
    }

    public getFocusedIndex() {
        return this.indexTracker.focusIdx;
    }

    public getFocusedItem(): DomElement | undefined {
        const idx = this.getFocusedIndex();
        const buffer = this.buffer.read();
        const idxOf = buffer.indexOf(idx);
        return this._treeService.children[idxOf];
    }

    private reconcile() {
        this.buffer.reconcile({
            bufferSize: this.sizing.bufferSize,
            data: this.getData(),
            focusIdx: this.indexTracker.focusIdx,
            focusChangeDirection: this.indexTracker.changeDirection,
        });

        const nextKeyedElements = this.reconcileNextElements();
        const nextChildren = [...nextKeyedElements.values()];
        const prevChildren = this._treeService.children;
        const isDiff =
            nextChildren.length !== prevChildren.length ||
            nextChildren.some((c, i) => c !== prevChildren[i]);

        if (isDiff) {
            // free memory for elements not in the next map
            for (const [k, v] of this.currentKeyedElements) {
                if (nextKeyedElements.get(k)) continue;
                // freeing the memory is causing yoga errors so we are doing something wrong
                // either here or in the tree service
                this._treeService.removeChild(v, false);
            }

            const children = this.children;
            for (const child of children) {
                this.removeChild(child, false);
            }

            for (const el of nextChildren) {
                this.appendChild(el);
                this._focusService.bindChild(el);
            }
        }

        this.currentKeyedElements = nextKeyedElements;
        const focusedItem = this.getFocusedItem();

        if (focusedItem !== this._focusService.focused) {
            this._focusService.focused?.blur();
            focusedItem?.focus();
        }
    }

    private reconcileNextElements(): Map<string, DomElement> {
        const indexes = this.buffer.read();
        const keys = this.createKeys(indexes);

        const map = new Map<string, DomElement>();
        const renderItem = this.getItemRenderer();
        const data = this.getData();

        for (let i = 0; i < indexes.length; ++i) {
            const key = keys[i];
            const dataIdx = indexes[i];
            const currentItemWithKey = this.currentKeyedElements.get(key);

            let el = currentItemWithKey;
            if (!el) {
                el = renderItem(data[dataIdx], dataIdx);
                el._shadow.blockFlexShrink(true);
            }

            map.set(key, el);
        }

        return map;
    }

    private createKeys(indexes: number[]) {
        const keyGenerator = this.getKeyGenerator();
        const data = this.getData();

        return indexes.map((index) => {
            return keyGenerator(data[index]);
        });
    }

    private getItemRenderer() {
        return this._getAnyProp("renderItem")!;
    }

    private getKeyGenerator() {
        return this._getAnyProp("getItemKey")!;
    }

    private getData() {
        return this._getAnyProp("data") ?? [];
    }

    private getBufferSize(itemSize: number) {
        const isRow = this._virtual.flexDirection?.includes("row");
        const contentUnits = isRow
            ? this.visibleContentRect.width
            : this.visibleContentRect.height;

        return Math.ceil(contentUnits / Math.max(1, itemSize));
    }

    private getItemSize() {
        if (!this.firstElementChild) {
            return 1;
        }

        // this.itemSize = Math.max(1, child.unclippedRect.height);
        // this.bufferSize = this.getBufferSize(this.itemSize);

        const isRow = this._virtual.flexDirection?.includes("row");
        return isRow
            ? this.firstElementChild.unclippedRect.width
            : this.firstElementChild.unclippedRect.height;
    }

    private getSizing() {
        const itemSize = this.getItemSize();
        const bufferSize = this.getBufferSize(itemSize);

        return { itemSize, bufferSize };
    }
}

export class IndexBuffer {
    private _buffer: number[];
    private _data: any[];
    private _host: VirtualListElement;

    constructor(host: VirtualListElement) {
        this._buffer = [];
        this._data = [];
        this._host = host;
    }

    public read(): number[] {
        return [...this._buffer];
    }

    public reconcile({
        bufferSize,
        focusIdx,
        focusChangeDirection,
        data,
    }: {
        bufferSize: number;
        focusIdx: number;
        focusChangeDirection: -1 | 1 | 0;
        data: any[];
    }) {
        this._data = data;

        this._buffer = this.resize(bufferSize);
        this._buffer = this.shift(focusIdx);
        this._buffer = this.applyOffset(focusChangeDirection, focusIdx);
    }

    private fillFromStart(start: number) {
        start = Math.max(0, start);
        let next = [] as number[];
        for (let i = 0; i < this._buffer.length; ++i) {
            if (this.isLegalIndex(start + i)) {
                next.push(start + i);
            }
        }

        // Example - data changes from larger to smaller where larger focus is
        // out of range of smaller
        // prev: [100, 101, **102**]
        // expected next: [0, 1, **2**]
        // next focus becomes next data.length - 1
        // since focus shifts out of bounds of prev to the left, we call fillFromStart(2)
        // which generates only [2]
        if (next.length >= this._buffer.length) {
            return next;
        }

        if (next[next.length - 1] === this._data.length - 1) {
            next = this.fillFromDataEnd();
        } else {
            next = this.fillFromDataStart();
        }

        return next;
    }

    private fillFromEnd(end: number) {
        const start = end - this._buffer.length + 1;
        return this.fillFromStart(start);
    }

    private fillFromDataEnd() {
        return this.fillFromEnd(this._data.length - 1);
    }

    private fillFromDataStart() {
        return this.fillFromStart(0);
    }

    private resize(bufferSize: number) {
        const prevBuffer = [...this._buffer];
        this._buffer = Array.from({ length: Math.min(bufferSize, this._data.length) });

        let next = prevBuffer;
        if (bufferSize < prevBuffer.length) {
            next = this.compress(prevBuffer);
        } else if (bufferSize > prevBuffer.length) {
            next = this.expand(prevBuffer);
        }
        return next ?? prevBuffer;
    }

    private expand(prevBuffer: number[]) {
        const strategy = this._host.getProp("expandStrategy") ?? "fillEnd";
        const start = prevBuffer[0] ?? 0;
        const end = prevBuffer[prevBuffer.length - 1] ?? 0;

        let next = prevBuffer;
        if (strategy === "fillEnd") {
            next = this.fillFromStart(start);
        } else if (strategy === "fillStart") {
            next = this.fillFromStart(end);
        } else {
            const offset = Math.ceil((this._buffer.length - prevBuffer.length) / 2);
            next = this.fillFromStart(start - offset);
        }

        return next;
    }

    private compress(prevBuffer: number[]) {
        const strategy = this._host.getProp("compressStrategy") ?? "clipEnd";
        const start = prevBuffer[0] ?? 0;
        const end = prevBuffer[prevBuffer.length - 1] ?? 0;

        let next = prevBuffer;
        if (strategy === "clipStart") {
            next = this.fillFromStart(start);
        } else if (strategy === "clipEnd") {
            next = this.fillFromEnd(end);
        } else {
            const offset = Math.ceil((prevBuffer.length - this._buffer.length) / 2);
            next = this.fillFromStart(start + offset);
        }

        return next;
    }

    private shift(nextFocusIdx: number) {
        const bufferStart = this._buffer[0] ?? 0;
        const bufferEnd = this._buffer[this._buffer.length - 1] ?? 0;

        let next = [...this._buffer];
        if (nextFocusIdx < bufferStart) {
            next = this.fillFromStart(nextFocusIdx);
        } else if (nextFocusIdx > bufferEnd) {
            next = this.fillFromEnd(nextFocusIdx);
        } else if (bufferEnd > this._data.length - 1) {
            next = this.fillFromDataEnd();
        }

        return next;
    }

    private applyOffset(dir: -1 | 1 | 0, focusIdx: number) {
        const offset = this.resolveOffset(this._host.getProp("offset") ?? 0);
        const legalStart = this.getLegalStart(offset);
        const legalEnd = this.getLegalEnd(offset);
        const fillStart = () => this.fillFromStart(focusIdx - offset);
        const fillEnd = () => this.fillFromEnd(focusIdx + offset);

        let next = [...this._buffer];

        // there are no legal indexes, so offset should be applied in a way that
        // depends on the direction in which focus changed.  This is necessary
        // for keeping focus centered when there is an even buf length
        if (legalStart >= legalEnd) {
            if (dir < 0) {
                next = fillEnd();
            } else {
                next = fillStart();
            }
        } else if (focusIdx < legalStart) {
            next = fillStart();
        } else if (focusIdx > legalEnd) {
            next = fillEnd();
        }

        return next;
    }

    private isLegalIndex(n: number) {
        const data = this._host.getProp("data") ?? [];
        return n >= 0 && n < data.length;
    }

    private resolveOffset(offset: number) {
        // offset is a percentage
        if (offset < 1) {
            offset = Math.max(0, offset);
            offset = Math.floor(this._buffer.length * offset);
        }

        return offset;
    }

    private getLegalStart(offset: number) {
        return this._buffer[offset] ?? this._buffer[this._buffer.length - 1] ?? 0;
    }

    private getLegalEnd(offset: number) {
        return this._buffer[this._buffer.length - 1 - offset] ?? this._buffer[0] ?? 0;
    }
}

class FocusIndexTracker {
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
