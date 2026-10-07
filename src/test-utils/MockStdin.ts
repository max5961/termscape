import type { StdinLike } from "../Types.js";

export interface IMockStdin {
    sendStdinData(data: Buffer | string): void;
}

export class MockStdin implements StdinLike, IMockStdin {
    private dataHandlers = new Set<(buf: Buffer) => unknown>();

    public sendStdinData(data: Buffer | string) {
        if (typeof data === "string") {
            data = Buffer.from(data);
        }

        this.dataHandlers.forEach((cb) => cb(data));
    }

    get isTTY() {
        return true;
    }

    on(_e: "data", cb: (buf: Buffer) => unknown): void {
        this.dataHandlers.add(cb);
    }

    off(_e: "data", cb: (buf: Buffer) => unknown): void {
        this.dataHandlers.delete(cb);
    }

    pause(): void {
        //
    }

    resume(): void {
        //
    }

    setRawMode(_v: boolean): void {
        //
    }
}
