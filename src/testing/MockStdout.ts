import type { Stdout } from "../Types.js";

export type MockStdoutConfig = {
    rows: number;
    columns: number;
};

export function getMockStdout(config: MockStdoutConfig): Stdout {
    return new MockStdout(config) as unknown as Stdout;
}

export class MockStdout {
    private _rows: number;
    private _columns: number;
    private _resizeHandlers: Set<() => unknown>;

    constructor({ rows, columns }: MockStdoutConfig) {
        this._rows = rows;
        this._columns = columns;
        this._resizeHandlers = new Set();
    }

    public get rows() {
        return this._rows;
    }

    public get columns() {
        return this._columns;
    }

    public write = (_data: string) => {
        // if (this._writeStdout) {
        //     process.stdout.write(data);
        // }
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
