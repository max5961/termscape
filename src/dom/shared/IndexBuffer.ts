import type { VirtualListElement } from "../VirtualListElement.js";

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
        let next = [...this._buffer];
        if (nextFocusIdx < this._buffer[0]) {
            next = this.fillFromStart(nextFocusIdx);
        } else if (nextFocusIdx > this._buffer[this._buffer.length - 1]) {
            next = this.fillFromEnd(nextFocusIdx);
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
