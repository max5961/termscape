import type { Stdin } from "../Types.js";

export type MockStdinConfig = {
    /** @default "mock" */
    stdinSource?: "real" | "mock";
};

export function getMockStdin(config: MockStdinConfig) {
    return new MockStdin(config) as unknown as Stdin;
}

class MockStdin {
    private _history: Buffer[];
    private _dataHandlers: Set<(buf: Buffer) => unknown>;

    public isTTY: boolean;

    constructor({ stdinSource }: MockStdinConfig) {
        this._history = [];
        this._dataHandlers = new Set();
        this.isTTY = true;
        if (stdinSource === "real") {
            this.initPipe();
        }
    }

    private initPipe() {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on("data", (buf) => {
            this.write(buf);
        });
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
