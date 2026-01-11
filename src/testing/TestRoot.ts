import fs from "node:fs";
import path from "node:path";
import type { MouseEventType, Runtime, _Omit } from "../Types.js";
import { Root } from "../dom/RootElement.js";
import { Canvas } from "../compositor/Canvas.js";
import { getMockStdout, MockStdout, type MockStdoutConfig } from "./MockStdout.js";
import { getMockStdin } from "./MockStdin.js";
import { TEST_ROOT_ELEMENT } from "../Constants.js";
import * as TestUtil from "./util.js";
import type { TestScheduler } from "../shared/Scheduler.js";

// prettier-ignore
export type TestRuntime = _Omit<
    Runtime &
    MockStdoutConfig,
    "stdout" | "stdin"
>

export class TestRoot extends Root {
    protected static override identity = TEST_ROOT_ELEMENT;

    private _lastFrame: string;
    private _frames: string[];

    public static Frame = "\n$$$$FRAME$$$$\n";

    constructor(c: TestRuntime) {
        // None of these impact the actual generated frames.
        c.exitForcesEndProc ??= false;
        c.exitOnCtrlC ??= false;
        c.enableMouse ??= false;
        c.enableKittyProtocol ??= false;
        c.altScreen ??= false;
        c.exitForcesEndProc ??= false;

        super({
            ...c,
            stdout: getMockStdout({
                rows: c.rows,
                columns: c.columns,
            }),
            stdin: getMockStdin(),
        });
        this._lastFrame = "";
        this._frames = [];

        this.addHook("post-layout", this.postLayout.bind(this));
    }

    public exitIfDone(op: undefined | (() => unknown)) {
        if (this._frames.length && !op) {
            this.exit();
        }
    }

    private postLayout(canvas: Canvas) {
        const nextFrame = Canvas.stringifyGrid(canvas.grid).output;

        if (this._lastFrame !== nextFrame) {
            this._lastFrame = nextFrame;
            this._frames.push(TestRoot.Frame + nextFrame);
        }
    }

    private get mockStdout() {
        return this.runtime.stdout as unknown as MockStdout;
    }

    private get testScheduler() {
        return this.scheduler as TestScheduler;
    }

    public dispatchResizeEvent = (
        ...args: Parameters<MockStdout["dispatchResizeEvent"]>
    ) => {
        this.mockStdout.dispatchResizeEvent(...args);
    };

    public dispatchMouseEvent = (x: number, y: number, type: MouseEventType) => {
        this.emitter.emit("MouseEvent", x, y, type);
    };

    public sendOps(ops: (string | (() => unknown))[]): void {
        this.testScheduler.sendOps(ops);
    }

    public recordFrames(fpath: string) {
        fs.mkdirSync(path.dirname(fpath), { recursive: true });
        fs.writeFileSync(fpath, this._frames.join(""), "utf8");
    }

    public replayAuto(name?: string) {
        const frames = TestUtil.getParsedFrames(this._frames);
        TestUtil.playFrames(frames, name);
    }

    public replayInteractive(nextKey: string, name?: string) {
        const frames = TestUtil.getParsedFrames(this._frames);
        TestUtil.playFramesInteractive(frames, nextKey, name);
    }
}
