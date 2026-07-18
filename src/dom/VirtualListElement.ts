import type { Props } from "./props/Props.js";
import { TagNameEnum, VIRTUAL_LIST_ELEMENT } from "../Constants.js";
import { DomElement } from "./DomElement.js";
import type { Style } from "./style/Style.js";
import { IndexBuffer, type IndexBufferOpts } from "./shared/IndexBuffer.js";

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
    private _realized: Map<string, DomElement>;

    constructor(props: IndexBufferOpts<T>) {
        super();

        this._realized = new Map();
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
        this.reconcile();

        this.afterLayout({
            subscribe: true,
            handler: () => {
                const prevSize = this._opts.size;
                const nextSize = this.visibleContentRect.height;

                if (prevSize !== nextSize) {
                    this.size = nextSize;
                    this.reconcile();
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
        this._opts.data = d;
        this.reconcile();
    }
    public get data(): Readonly<unknown[]> {
        return this._opts.data;
    }

    public set size(n: number) {
        this._opts.size = n;
        this.reconcile();
    }
    public get size() {
        return this._opts.size;
    }

    public focusNext(n: number = 1) {
        this.setNextFocus(n);
        this.reconcile();
    }

    public focusPrev(n: number = 1) {
        this.setNextFocus(-n);
        this.reconcile();
    }

    private setNextFocus(d: number) {
        let n = this._focusIdx + d;
        n = Math.min(n, this._opts.data.length - 1);
        n = Math.max(0, n);

        this._focusIdx = n;
    }

    private reconcile() {
        const prev = this._buffer.read();
        this._buffer.reconcile({ ...this._opts, nextFocusIdx: this._focusIdx });
        const next = this._buffer.read();

        for (let i = 0; i < prev.length; ++i) {
            const key = this._opts.getItemKey(this._opts.data[prev[i]]);
            this._realized.set(key, this._children[i]);
        }

        const children = [...this._children];
        for (const child of children) {
            this.removeChild(child);
        }

        for (let i = 0; i < next.length; ++i) {
            const dataIdx = next[i];
            const key = this._opts.getItemKey(this._opts.data[dataIdx]);
            const el =
                this._realized.get(key) ??
                this._opts.renderItem(this._opts.data[dataIdx], dataIdx);

            this.appendChild(el);
            el._focusNode.becomeProvider(dataIdx === this._focusIdx);
            el._focusNode.setOwnProvider(dataIdx === this._focusIdx);
            el.style.flexShrink = 0;
        }
    }
}
