import fs from "node:fs";
import { Root } from "./Root.js";
import type { RuntimeConfig } from "../Types.js";
import type { Canvas } from "../compositor/Canvas.js";
import { TEST_ROOT_ELEMENT } from "../Symbols.js";

export class MockStdout {
    private _rows: number;
    private _columns: number;
    private resizeHandlers: Set<() => unknown>;
    private shouldWrite: boolean;

    constructor({
        rows,
        columns,
        shouldWrite,
    }: {
        rows: number;
        columns: number;
        shouldWrite: boolean;
    }) {
        this._rows = rows;
        this._columns = columns;
        this.shouldWrite = shouldWrite;
        this.resizeHandlers = new Set();
    }

    public get rows() {
        return this._rows;
    }

    public get columns() {
        return this._columns;
    }

    public write = (data: string) => {
        if (this.shouldWrite) {
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

export class MockStdin {
    private history: Buffer[];
    private dataHandlers: Set<(buf: Buffer) => unknown>;
    private pipeFromReal: boolean;

    constructor({ pipeFromReal }: { pipeFromReal: boolean }) {
        this.history = [];
        this.dataHandlers = new Set();
        this.pipeFromReal = pipeFromReal;
        if (this.pipeFromReal) {
            this.initPipe();
        }
    }

    private initPipe() {
        process.stdin.setRawMode(true);
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

    public write(chunk: string | Buffer) {
        if (typeof chunk === "string") {
            chunk = Buffer.from(chunk);
        }
        this.dataHandlers.forEach((handler) => handler(chunk));
        this.history.push(chunk);
    }
}

type TestRootRuntimeConfig = Omit<RuntimeConfig, "stdout" | "stdin"> & {
    rows: number;
    columns: number;
    /** Write frames to stdout as well as record */
    shouldWrite: boolean;
    /** When to end runtime */
    maxFrames: number;
};

export class TestRoot extends Root {
    protected static override identity = TEST_ROOT_ELEMENT;

    private lastFrame: string;
    private frames: string[];
    private maxFrames: number;

    private static Frame = "$$$$START_FRAME$$$$";

    constructor(runtime: TestRootRuntimeConfig) {
        super({
            ...runtime,
            stdout: new MockStdout({
                rows: runtime.rows,
                columns: runtime.columns,
                shouldWrite: runtime.shouldWrite,
            }) as unknown as NodeJS.WriteStream,
        });

        this.lastFrame = "";
        this.frames = [];
        this.maxFrames = runtime.maxFrames;

        // this.hooks.postLayout(this.postLayout);
    }

    private postLayout = (canvas: Canvas) => {
        const { output } = canvas.stringifyGrid();

        if (this.lastFrame !== output) {
            this.lastFrame = output;
            this.frames.push(output);
        }

        if (this.frames.length >= this.maxFrames) {
            // process.nextTick for now, but need to make this a 'postWrite' hook
            // which isn't yet a thing
            process.nextTick(() => {
                this.exit();
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

    /** UNFINISHED */
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
}
