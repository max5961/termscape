import fs from "node:fs";
import { Root } from "./RootElement.js";
import { TEST_ROOT_ELEMENT } from "../Constants.js";
import type { RuntimeConfig } from "../Types.js";
import { Canvas } from "../compositor/Canvas.js";

type MockStdoutConfig = {
    /** @default 25*/
    rows?: number;
    /** @default 80 */
    columns?: number;
    /**
     * Each rendered frame is always captured. But in test runners you might not
     * want to pollute the stdout by writing.
     * @default true
     * */
    writeStdout?: boolean;
};

type MockStdinConfig = {
    /** @default "mock" */
    stdinSource?: "real" | "mock";
};

// prettier-ignore
export type TestConfig = 
    MockStdoutConfig &
    MockStdinConfig & {
        /** @default Infinity */
        maxFrames?: number;
    };

type TestRootConfig = Omit<RuntimeConfig, "stdin" | "stdout">;

type TestRootRuntime = TestConfig & RuntimeConfig;

class MockStdout {
    private _rows: number;
    private _columns: number;
    private resizeHandlers: Set<() => unknown>;
    private writeStdout: boolean;

    constructor({ rows, columns, writeStdout }: Required<MockStdoutConfig>) {
        this._rows = rows;
        this._columns = columns;
        this.writeStdout = writeStdout;
        this.resizeHandlers = new Set();
    }

    public get rows() {
        return this._rows;
    }

    public get columns() {
        return this._columns;
    }

    public write = (data: string) => {
        if (this.writeStdout) {
            process.stdout.write(data);
        }
    };

    public on = (_resize: "resize", cb: () => unknown) => {
        this.resizeHandlers.add(cb);
    };

    public off = (_resize: "resize", cb: () => unknown) => {
        this.resizeHandlers.delete(cb);
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

        this.resizeHandlers.forEach((handler) => {
            handler();
        });
    };
}

class MockStdin {
    private history: Buffer[];
    private dataHandlers: Set<(buf: Buffer) => unknown>;

    public isTTY: boolean;

    constructor({ stdinSource }: MockStdinConfig) {
        this.history = [];
        this.dataHandlers = new Set();
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
        this.dataHandlers.add(cb);
    };

    public off = (_type: "data", cb: (buf: Buffer) => unknown) => {
        this.dataHandlers.delete(cb);
    };

    public resume() {}
    public pause() {}
    public setRawMode() {}

    public write(chunk: string | Buffer) {
        if (typeof chunk === "string") {
            chunk = Buffer.from(chunk);
        }

        this.dataHandlers.forEach((handler) => handler(chunk));
        this.history.push(chunk);
    }
}

export class TestRoot extends Root {
    protected static override identity = TEST_ROOT_ELEMENT;
    private static Frame = "$$$$START_FRAME$$$$";

    private lastFrame: string;
    private frames: string[];
    private maxFrames: number;

    constructor(runtime: TestRootRuntime) {
        const {
            rows = 25,
            columns = 80,
            stdinSource = "mock",
            writeStdout = true,
            maxFrames = Infinity,
        } = runtime;

        super({
            ...runtime,
            stdin: new MockStdin({ stdinSource }) as unknown as typeof process.stdin,
            stdout: new MockStdout({
                rows,
                columns,
                writeStdout,
            }) as unknown as NodeJS.WriteStream,
        });

        this.maxFrames = maxFrames;
        this.lastFrame = "";
        this.frames = [];

        this.addHook("post-layout", this.postLayout);
    }

    private postLayout = (canvas: Canvas) => {
        const { output } = Canvas.stringifyGrid(canvas.grid);

        if (this.lastFrame !== output) {
            this.lastFrame = output;
            this.frames.push(output);
        }

        if (this.frames.length >= this.maxFrames) {
            process.nextTick(() => {
                this.addHook("post-write", () => this.exit());
            });
        }
    };

    public recordFrames(fpath: string) {
        const contents = this.frames
            .map((frame) => {
                return TestRoot.Frame + frame;
            })
            .join("");

        fs.writeFileSync(fpath, contents, "utf8");

        this.frames = [];
    }

    /** TODO - UNFINISHED */
    public playFromFile(fpath: string, nextFrame = "n") {
        const frames = fs.readFileSync(fpath, "utf8").split(TestRoot.Frame);

        // let lastNewLines = 0;
        const handleStdin = (buf: Buffer) => {
            if (buf.toString("utf8") === nextFrame) {
                const frame = frames.shift();
                if (frame) {
                    // process.stdout.write(clearPrevRows(lastNewLines));
                    // lastNewLines = num of \n in frame
                    process.stdout.write(frame);
                }
            }

            if (buf[0] === 3 || !frames.length) {
                process.stdin.off("data", handleStdin);
            }
        };

        if (frames.length) {
            process.stdin.setRawMode(true);
            process.stdin.on("data", handleStdin);
        }
    }

    public sendKeys(interval: number, keys: string[]) {
        const intervalID = setInterval(() => {
            const nextKey = keys.shift();
            if (nextKey) {
                this.runtime.stdin.write(Buffer.from(nextKey));
            } else {
                clearInterval(intervalID);
            }
        }, interval);
    }
}

export const createTestRoot =
    (testConfig?: TestConfig) => (rootConfig: TestRootConfig) => {
        testConfig ??= {};

        return new TestRoot({
            ...rootConfig,
            ...testConfig,
        });
    };
