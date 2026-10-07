import type { StdoutLike } from "../Types.js";

export interface IMockStdout {
    emitResizeEvent(
        type: "set" | "offset",
        { rows, columns }: { rows: number; columns: number },
    ): void;
}

export class MockStdout implements StdoutLike, IMockStdout {
    private _rows: number;
    public get rows() {
        return this._rows;
    }
    public set rows(_n: number) {
        // noop
    }
    private _columns: number;
    public get columns() {
        return this._columns;
    }
    public set coluns(_n: number) {
        // noop
    }
    private resizeListeners = new Set<() => unknown>();

    constructor({ rows, columns }: { rows: number; columns: number }) {
        this._rows = rows;
        this._columns = columns;
    }

    public emitResizeEvent(
        type: "set" | "offset",
        { rows, columns }: { rows: number; columns: number },
    ) {
        if (type === "set") {
            this._rows = rows;
            this._columns = columns;
        } else {
            this._rows += rows;
            this._columns += columns;
        }

        this._rows = Math.max(0, this._rows);
        this._columns = Math.max(0, this._columns);

        this.resizeListeners.forEach((handler) => {
            handler();
        });
    }

    on(_e: "resize", cb: () => unknown): void {
        this.resizeListeners.add(cb);
    }

    off(_e: "resize", cb: () => unknown): void {
        this.resizeListeners.delete(cb);
    }

    // noop
    write(_d: string | Buffer): void {}

    // noop
    setMaxListeners(_n: number): StdoutLike {
        return this;
    }
}
