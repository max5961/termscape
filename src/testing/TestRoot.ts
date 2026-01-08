import fs from "node:fs";
import path from "node:path";
import type { Runtime, _Omit } from "../Types.js";
import { Root } from "../dom/RootElement.js";
import { Canvas } from "../compositor/Canvas.js";
import { getMockStdout, type MockStdoutConfig } from "./MockStdout.js";
import { getMockStdin, type MockStdinConfig } from "./MockStdin.js";
import { TEST_ROOT_ELEMENT } from "../Constants.js";
import type { Snapshot } from "./configureSnapshot.js";

// prettier-ignore
export type TestRuntime = _Omit<
    { mode: Snapshot["mode"]} &
    Runtime &
    MockStdoutConfig &
    MockStdinConfig & {
        maxFrames: number;
    },
    "stdout" | "stdin"
>

export class TestRoot extends Root {
    protected static override identity = TEST_ROOT_ELEMENT;

    private _lastFrame: string;
    private _frames: string[];
    private _mode: Snapshot["mode"];

    private static Frame = "\n$$$$FRAME$$$$\n";

    constructor(c: TestRuntime) {
        c.exitForcesEndProc ??= false;
        c.enableMouse ??= false;
        c.enableKittyProtocol ??= false;
        c.altScreen ??= false;
        c.exitForcesEndProc ??= false;
        c.exitOnCtrlC ??= true;

        super({
            ...c,
            stdout: getMockStdout({
                rows: c.rows,
                columns: c.columns,
                writeStdout: c.writeStdout,
            }),
            stdin: getMockStdin({ stdinSource: c.stdinSource }),
        });
        this._lastFrame = "";
        this._frames = [];
        this._mode = c.mode;

        this.addHook("post-layout", this.postLayout.bind(this));
    }

    public get isFrameTesting() {
        return this._mode === "frames";
    }

    public exitIfDone(op: undefined | (() => unknown)) {
        if (this._mode === "frames" && this._frames.length && !op) {
            this.exit();
        }
    }

    // CHORE - frames should trim whitespace which would be safer in case of
    // improperly read ambiwidth chars and more predictable for testing.

    private postLayout(canvas: Canvas) {
        const nextFrame = Canvas.stringifyGrid(canvas.grid).output;

        if (this._lastFrame !== nextFrame) {
            this._lastFrame = nextFrame;
            this._frames.push(TestRoot.Frame + nextFrame);
        }
    }

    public sendKeys(keys: string[]) {
        for (const key of keys) {
            this.runtime.stdin.write(Buffer.from(key));
        }
    }

    public recordFrames(fpath: string) {
        fs.mkdirSync(path.dirname(fpath), { recursive: true });
        fs.writeFileSync(fpath, this._frames.join(""), "utf8");
    }

    public playFrames(name?: string) {
        const frames = this._frames
            .join("")
            .split(TestRoot.Frame)
            .filter((frame) => frame);

        frames.forEach((frame, idx) => {
            process.stdout.write(`Frame ${idx + 1}${name ? " - " + name : ""}\n`);
            process.stdout.write(frame + "\n");
        });
    }

    private writeFrame(frame: string, idx: number) {
        process.stdout.write(`Frame ${idx}\n${"━".repeat(process.stdout.columns)}\n`);
        process.stdout.write(frame);
    }

    public readFrames(fpath: string) {
        const contents = fs.readFileSync(fpath, "utf8");
        const frames = contents.split(TestRoot.Frame);

        let frame = undefined;
        let i = 0;
        while ((frame = frames.shift()) && ++i) {
            this.writeFrame(frame, i);
        }
    }

    public readFramesStep(fpath: string, nextKey: string) {
        const contents = fs.readFileSync(fpath, "utf8");
        const frames = contents.split(TestRoot.Frame);

        let i = 0;
        const handleStdin = (buf: Buffer) => {
            const off = () => {
                process.stdin.setRawMode(false);
                process.stdin.pause();
                process.stdin.removeListener("data", handleStdin);
            };

            const frame = frames.shift();
            if (!frame || buf[0] === 3) {
                return off();
            }
            if (buf.toString("utf8") !== nextKey) {
                return;
            }

            this.writeFrame(frame, ++i);
            if (!frames.length) {
                return off();
            }
        };

        process.stdin.resume();
        process.stdin.setRawMode(true);
        process.stdin.on("data", handleStdin);
    }
}
