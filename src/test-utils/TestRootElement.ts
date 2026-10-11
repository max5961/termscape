import fs from "node:fs";
import path from "node:path";
import { RootElement } from "../dom/RootElement.js";
import type { CreateCore } from "../Types.js";
import type { CoreTestRootElement } from "./CoreTestRoot.js";
import type { MockStdin } from "./MockStdin.js";
import type { MockStdout } from "./MockStdout.js";
import { GridConverter } from "../core/renderer/GridConverter.js";
import type { Grid } from "../core/canvas/types.js";

type After = {
    testName?: string;
    suiteName?: string;
    write?: "actual" | "expected";
    replay?: "static" | "interactive";
    interactiveKey?: string;
    compareReplay?: boolean;

    // would need a separate function outside the scope of TestRootElement.after to
    // handle this so that you could examine snapshots without creating a TestRootElement
    // and for comparative replay
    // replaySource?: "actual" | "expected";
};

export class TestRootElement extends RootElement {
    protected declare _core: CoreTestRootElement;
    private frames: string[] = [];
    private ops: (() => unknown)[] = [];
    private afterSettings: After = {};

    constructor(createCore: CreateCore<CoreTestRootElement>) {
        super(createCore);
        this._core.on("post-layout", this.handlePostLayout);
        this._core.on("end-runtime", this.handleAfter);
    }

    private static Frame = "\n$$$$FRAME$$$$\n";

    private get mockStdin() {
        return this._core.stdin as MockStdin;
    }
    private get mockStdout() {
        return this._core.stdout as MockStdout;
    }

    public readonly queue = Object.freeze({
        resize: (
            ...[type, { rows, columns }]: Parameters<MockStdout["emitResizeEvent"]>
        ) => {
            return this.queue.operation(() => {
                this.mockStdout.emitResizeEvent(type, { rows, columns });
            });
        },
        stdin: (...[data]: Parameters<MockStdin["sendStdinData"]>) => {
            return this.queue.operation(() => {
                this.mockStdin.sendStdinData(data);
            });
        },
        operation: (cb: () => unknown) => {
            this.ops.push(cb);
            return this.queue;
        },
    });

    public readonly after = Object.freeze({
        testName: (testName: string) => {
            this.afterSettings.testName = testName;
            return this.after;
        },
        suiteName: (suiteName: string) => {
            this.afterSettings.suiteName = suiteName;
            return this.after;
        },
        write: (type: "actual" | "expected") => {
            this.afterSettings.write = type;
            return this.after;
        },
        replay: (type: "static" | "interactive") => {
            this.afterSettings.replay = type;
            return this.after;
        },
        interactiveKey: (key: string) => {
            this.afterSettings.interactiveKey = key;
            return this.after;
        },
        compare: (_v: boolean) => {
            return this.after;
        },
    });

    private handleAfter = () => {
        const {
            write: extension,
            replay: replayType,
            suiteName,
            testName,
            interactiveKey,
        } = this.afterSettings;

        if (testName && extension) {
            this.writeFile(suiteName, testName, extension);
        }

        if (replayType) {
            this.handleReplay(replayType, interactiveKey);
        }
    };

    private writeFile(
        suiteName: undefined | string,
        testName: string,
        extension: string,
    ) {
        const contents = this.frames.join(TestRootElement.Frame);

        // ensure snapshots directory exists
        const snapshots = path.join(process.cwd(), "snapshots");
        fs.mkdirSync(snapshots, { recursive: true });

        // suiteName and testName are always snake_case
        // suite name is always uppercase (if provided)
        suiteName = suiteName?.split(" ").join("_").toUpperCase();
        // testName is always lowercase
        testName = testName.split(" ").join("_").toLowerCase();

        const fileName = `${suiteName ? suiteName + "_" : ""}${testName}.${extension}`;
        const fpath = `${snapshots}/${fileName}`;
        fs.writeFileSync(fpath, contents, "utf8");
    }

    private handleReplay(
        replayType: After["replay"],
        interactiveKey?: After["interactiveKey"],
    ) {
        return replayType === "static"
            ? this.handleStaticReplay()
            : this.handleInteractiveReplay(interactiveKey);
    }

    private handleInteractiveReplay(interactiveKey?: After["interactiveKey"]) {
        const nextKey = interactiveKey ?? "n";

        process.stdout.write(
            `Interactive replay mode.  Press '${nextKey}' to print the next frame.\n`,
        );

        let i = 0;
        const handleData = (buf: Buffer) => {
            if (buf[0] === 3) process.exit();
            if (buf.toString() !== nextKey) return;

            const frame = this.frames.shift();
            if (frame) {
                this.printFrame(++i, frame);
            }

            if (frame === undefined || !this.frames.length) {
                process.stdin.off("data", handleData);
                process.exit();
            }
        };

        process.stdin.setRawMode(true);
        process.stdin.on("data", handleData);
    }

    private handleStaticReplay() {
        this.frames.forEach((frame, idx) => {
            this.printFrame(idx, frame);
        });
    }

    private printFrame(idx: number, frame: string) {
        const line = "\n" + "─".repeat(process.stdout.columns) + "\n";
        process.stdout.write(`${line}Frame ${idx} ↓${line}${frame}`);
    }

    private handlePostLayout = (grid: Readonly<Grid>) => {
        const frame = GridConverter.stringifyGrid(grid).output;
        if (frame !== this.frames[this.frames.length - 1]) {
            this.frames.push(frame);
        }

        const op = this.ops.pop();
        return op ? op() : this.exit();
    };
}
