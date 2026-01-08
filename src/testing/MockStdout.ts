import type { Stdout } from "../Types.js";

export type MockStdoutConfig = {
    rows: number;
    columns: number;
    writeStdout: boolean;
};

export function getMockStdout(config: MockStdoutConfig): Stdout {
    return new MockStdout(config) as unknown as Stdout;
}

class MockStdout {
    private _rows: number;
    private _columns: number;
    private _writeStdout: boolean;
    private _resizeHandlers: Set<() => unknown>;

    constructor({ rows, columns, writeStdout }: MockStdoutConfig) {
        this._rows = rows;
        this._columns = columns;
        this._writeStdout = writeStdout;
        this._resizeHandlers = new Set();
    }

    public get rows() {
        return this._rows;
    }

    public get columns() {
        return this._columns;
    }

    public write = (data: string) => {
        if (this._writeStdout) {
            process.stdout.write(data);
        }
    };

    public on = (_resize: "resize", cb: () => unknown) => {
        this._resizeHandlers.add(cb);
    };

    public off = (_resize: "resize", cb: () => unknown) => {
        this._resizeHandlers.delete(cb);
    };

    public dispatchResizeEvent = (
        type: "set" | "offset",
        { rows, columns }: { rows: number; columns: number },
    ) => {
        if (type === "set") {
            this._rows = rows;
            this._columns = columns;
        } else {
            this._rows += rows;
            this._columns += columns;
        }

        this._rows = Math.max(0, this._rows);
        this._columns = Math.max(0, this._columns);

        this._resizeHandlers.forEach((handler) => {
            handler();
        });
    };
}
