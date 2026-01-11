import type { Stdin } from "../Types.js";

export function getMockStdin() {
    return new MockStdin() as unknown as Stdin;
}

export class MockStdin {
    private _history: Buffer[];
    private _dataHandlers: Set<(buf: Buffer) => unknown>;

    public isTTY: boolean;

    constructor() {
        this._history = [];
        this._dataHandlers = new Set();
        this.isTTY = true;
    }

    public on = (_type: "data", cb: (buf: Buffer) => unknown) => {
        this._dataHandlers.add(cb);
    };

    public off = (_type: "data", cb: (buf: Buffer) => unknown) => {
        this._dataHandlers.delete(cb);
    };

    public resume() {}
    public pause() {}
    public setRawMode() {}

    public write(chunk: string | Buffer) {
        if (typeof chunk === "string") {
            chunk = Buffer.from(chunk);
        }

        this._dataHandlers.forEach((handler) => handler(chunk));
        this._history.push(chunk);
    }
}
