import type { Props } from "./props/Props.js";
import { TagNameEnum, VIRTUAL_LIST_ELEMENT } from "../Constants.js";
import { DomElement } from "./DomElement.js";
import type { Style } from "./style/Style.js";
import { IndexBuffer, type IndexBufferOpts } from "./shared/IndexBuffer.js";
import { logger } from "../shared/Logger.js";

// - override onFocus/onBlur/onShallow... so that children of VirtualList dispatch
// these handlers at the control of VirtualList and not the FocusNode which is the
// default behavior.  There should be something like a 'visited indexes' Set that is
// used to see when to dispatch these handlers.
// - test for deletion, insertion, etc..
// - test for replacing data
// - modify other classes so that appendChild, insertChild, removeChild, etc.. can be noop-able

export class VirtualListElement<T = any> extends DomElement {
    protected static override identity = VIRTUAL_LIST_ELEMENT;

    private _opts: Required<IndexBufferOpts<T>>;
    private _focusIdx: number;
    private _buffer: IndexBuffer;

    constructor(props: IndexBufferOpts<T>) {
        super();

        props.offset ??= 0;
        props.initialIndex ??= 0;
        props.initialIndex = Math.max(0, props.initialIndex);
        props.expandStrategy ??= "fillEnd";
        props.compressStrategy ??= "clipEnd";
        props.size = 0;

        this._opts = props as Required<IndexBufferOpts<T>>;
        this._focusIdx = 0;
        this.setNextFocus(props.initialIndex);

        this._buffer = new IndexBuffer(this._opts);
        this.reconcile({ ...this._opts });

        this.afterLayout({
            subscribe: true,
            handler: () => {
                const prevSize = this._opts.size;
                const nextSize = this.visibleContentRect.height;

                if (prevSize !== nextSize) {
                    this.size = nextSize;
                    this.reconcile({ ...this._opts });
                    return true;
                }
                return false;
            },
        });
    }

    public override get tagName(): typeof TagNameEnum.VirtualListElement {
        return "virtual-list";
    }

    protected override get defaultProps(): Props.All {
        return {};
    }

    protected override get defaultStyles(): Style.All {
        return {
            flexDirection: "column",
        };
    }

    public set data(d: T[]) {
        this.reconcile({ ...this._opts, data: d });
    }
    public get data(): Readonly<T[]> {
        return this._opts.data;
    }

    public set size(n: number) {
        this._opts.size = n;
        this.reconcile({ ...this._opts, size: n });
    }
    public get size() {
        return this._opts.size;
    }

    public focusNext(n: number = 1) {
        this.setNextFocus(n);
        this.reconcile({ ...this._opts });
    }

    public focusPrev(n: number = 1) {
        this.setNextFocus(-n);
        this.reconcile({ ...this._opts });
    }

    private setNextFocus(d: number) {
        let n = this._focusIdx + d;
        n = Math.min(n, this._opts.data.length - 1);
        n = Math.max(0, n);

        this._focusIdx = n;
    }

    private reconcile(opts: Required<IndexBufferOpts>) {
        const prev = this._buffer.read();
        this._buffer.reconcile({ ...opts, nextFocusIdx: this._focusIdx });
        const next = this._buffer.read();

        const prevMap = new Map<string, DomElement>();
        const nextMap = new Map<string, DomElement>();

        const prevArr = [] as string[];
        const nextArr = [] as string[];

        for (let i = 0; i < prev.length; ++i) {
            const dataIdx = prev[i];
            const key = this._opts.getItemKey(this._opts.data[dataIdx]);
            prevMap.set(key, this._children[i]);
            prevArr.push(key);
            this._children[i]._becomeProvider(false);
            this._children[i]._setOwnProvider(false);
        }

        // Need to change opts AFTER using data to find the previous data
        this._opts = opts;

        for (let i = 0; i < next.length; ++i) {
            const dataIdx = next[i];
            const key = this._opts.getItemKey(this._opts.data[dataIdx]);
            if (prevMap.has(key)) {
                nextMap.set(key, prevMap.get(key)!);
            } else {
                nextMap.set(
                    key,
                    this._opts.renderItem(this._opts.data[dataIdx], dataIdx),
                );
            }
            nextArr.push(key);

            nextMap.get(key)!._becomeProvider(dataIdx === this._focusIdx);
            nextMap.get(key)!._setOwnProvider(dataIdx === this._focusIdx);
        }

        // logger.write({
        //     prevArr,
        //     nextArr,
        // });

        // this.reconcileBufs(prevArr, nextArr, prevMap, nextMap);
        this.reconcileBufs(prevArr, nextArr, nextMap);
    }

    private reconcileBufs(
        prevArr: string[],
        nextArr: string[],
        // prevMap: Map<string, DomElement>,
        nextMap: Map<string, DomElement>,
    ) {
        const diffIdxs = [] as number[];
        // const remove = [] as DomElement[];
        // const retain = [] as DomElement[];
        // const add = [] as DomElement[];

        for (let i = 0; i < Math.max(prevArr.length, nextArr.length); ++i) {
            if (prevArr[i] !== nextArr[i]) {
                diffIdxs.push(i);
            }
        }

        // No tree manipulation needed.
        if (!diffIdxs.length) {
            return;
        } else {
            const children = [...this._children];
            for (const child of children) {
                this.removeChild(child);
            }
            for (const key of nextArr) {
                this.appendChild(nextMap.get(key)!);
            }
        }
    }
}
