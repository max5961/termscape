import type { DomElement } from "../DomElement.js";

export type IndexBufferOpts<T = any> = {
    data: T[];
    size?: number;
    offset?: number;
    expandStrategy?: "fillStart" | "fillEnd" | "fillEqual";
    compressStrategy?: "clipStart" | "clipEnd" | "clipEqual";
    initialIndex?: number;

    // messy but whatever for now
    renderItem: (item: T, index: number) => DomElement;
    getItemKey: (item: T) => string;
    itemSize: number;
};

export class IndexBuffer {
    private _buffer: number[];
    private _focusIdx: number;
    private _opts: Required<IndexBufferOpts>;

    constructor(opts: Required<IndexBufferOpts>) {
        this._opts = opts;
        this._focusIdx = opts.initialIndex;
        this._buffer = [];
    }

    public read(): number[] {
        return [...this._buffer];
    }

    public reconcile(opts: Required<IndexBufferOpts> & { nextFocusIdx: number }) {
        this._opts = opts;

        const dir = opts.nextFocusIdx < this._focusIdx ? -1 : 1;
        this.resize(this._opts.size);
        this.shift(opts.nextFocusIdx);
        this.applyOffset(dir);
    }

    public getFocusIdx() {
        return this._focusIdx;
    }

    private fillFromStart(start: number) {
        start = this.clampIndex(start);
        const next = [] as number[];
        for (let i = 0; i < this._buffer.length; ++i) {
            if (this.isLegalIndex(start + i)) {
                next.push(start + i);
            }
        }
        return next;
    }

    private fillFromEnd(end: number) {
        end = this.clampIndex(end);
        const start = end - this._buffer.length + 1;
        return this.fillFromStart(start);
    }

    private fillFromDataEnd() {
        return this.fillFromEnd(this._opts.data.length - 1);
    }

    private fillFromDataStart() {
        return this.fillFromStart(0);
    }

    private resize(size: number) {
        if (size < this._buffer.length) {
            this.compress(size);
        } else if (size > this._buffer.length) {
            this.expand(size);
        }
    }

    private expand(size: number) {
        const prev = this._buffer;
        this._buffer = Array.from({ length: this.getMaxBufferSize(size) });

        let next: number[];
        const strategy = this._opts.expandStrategy;
        const start = prev[0] ?? this._focusIdx;
        const end = prev[prev.length - 1] ?? this._focusIdx;

        if (strategy === "fillEnd") {
            next = this.fillFromStart(start);
        } else if (strategy === "fillStart") {
            next = this.fillFromEnd(end);
        } else {
            const offset = Math.ceil((this._buffer.length - prev.length) / 2);
            next = this.fillFromStart(start - offset);
        }

        next = this.ensureBufferFullyFilled(next);
        this._buffer = next;
    }

    private compress(size: number) {
        const prev = this._buffer;
        this._buffer = Array.from({ length: this.getMaxBufferSize(size) });

        let next: number[];
        const strategy = this._opts.compressStrategy;
        const start = prev[0] ?? this._focusIdx;
        const end = prev[prev.length - 1] ?? this._focusIdx;

        if (strategy === "clipStart") {
            next = this.fillFromStart(start);
        } else if (strategy === "clipEnd") {
            next = this.fillFromEnd(end);
        } else {
            const offset = Math.ceil((prev.length - this._buffer.length) / 2);
            next = this.fillFromStart(start + offset);
        }

        this._buffer = next;
    }

    private shift(nextFocusIdx: number) {
        nextFocusIdx = this.clampIndex(nextFocusIdx);
        if (nextFocusIdx < this._buffer[0]) {
            this._buffer = this.fillFromStart(nextFocusIdx);
        } else if (nextFocusIdx > this._buffer[this._buffer.length - 1]) {
            this._buffer = this.fillFromEnd(nextFocusIdx);
        }

        this._focusIdx = nextFocusIdx;
    }

    private applyOffset(dir: -1 | 1) {
        let next: number[] | undefined = undefined;
        const offset = this.resolveOffset(this._opts.offset);
        const legalStart = this.getLegalStart(offset);
        const legalEnd = this.getLegalEnd(offset);
        const fillStart = () => this.fillFromStart(this._focusIdx - offset);
        const fillEnd = () => this.fillFromEnd(this._focusIdx + offset);

        // there are no legal indexes, so offset should be applied in a way that
        // depends on the direction in which focus changed.  This is necessary
        // for keeping focus centered when there is an even buf length
        if (legalStart >= legalEnd) {
            if (dir < 0) {
                next = fillEnd();
            } else {
                next = fillStart();
            }
        } else if (this._focusIdx < legalStart) {
            next = fillStart();
        } else if (this._focusIdx > legalEnd) {
            next = fillEnd();
        }

        if (next) {
            next = this.ensureBufferFullyFilled(next);
            this._buffer = next;
        }
    }

    private getMaxBufferSize(size: number) {
        return Math.min(size, this._opts.data.length);
    }

    private clampIndex(n: number) {
        n = Math.max(0, n);
        n = Math.min(n, this._opts.data.length - 1);
        return n;
    }

    private isLegalIndex(n: number) {
        return n >= 0 && n < this._opts.data.length;
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

    private ensureBufferFullyFilled(next: number[]) {
        if (next.length < this._buffer.length) {
            if (next[next.length - 1] === this._opts.data.length - 1) {
                next = this.fillFromDataEnd();
            } else {
                next = this.fillFromDataStart();
            }
        }

        return next;
    }
}
