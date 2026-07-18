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
        // Handle previous
        const prevIndexBuf = this._buffer.read();
        const prevKeys = this.createKeys(prevIndexBuf);
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

        // Get new buffer and update opts
        this._buffer.reconcile({ ...opts, nextFocusIdx: this._focusIdx });
        this._opts = opts;

        // Handle next
        const nextIndexBuf = this._buffer.read();
        const nextKeys = this.createKeys(nextIndexBuf);
        const nextMap = new Map<string, DomElement>();

        let nextFocus: DomElement | undefined = undefined;
        for (let i = 0; i < nextIndexBuf.length; ++i) {
            const dataIdx = nextIndexBuf[i];
            const key = nextKeys[i];
            const el =
                prevMap.get(key) ??
                this._opts.renderItem(this._opts.data[dataIdx], dataIdx);

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
            return;
        }

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

    private createKeys(indexBuf: number[]) {
        const keys = [] as string[];
        for (let i = 0; i < indexBuf.length; ++i) {
            const dataIdx = indexBuf[i];
            keys.push(this._opts.getItemKey(this._opts.data[dataIdx]));
        }
        return keys;
    }
}
