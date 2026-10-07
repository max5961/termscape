import type { Canvas } from "../core/canvas/Canvas.js";
import { GridConverter } from "../core/renderer/GridConverter.js";
import { RootElement } from "../dom/RootElement.js";
import type { CreateCore } from "../Types.js";
import type { CoreTestRootElement } from "./CoreTestRoot.js";
import type { IMockStdin, MockStdin } from "./MockStdin.js";
import type { IMockStdout, MockStdout } from "./MockStdout.js";

export type Operation =
    // stdin
    | Buffer
    // stdin
    | string
    // any operation, presumably expected to alter stdout
    | (() => unknown);

export class TestRootElement extends RootElement implements IMockStdout, IMockStdin {
    protected declare _core: CoreTestRootElement;
    private frames: string[] = [];
    private operations: Operation[] = [];

    constructor(createCore: CreateCore<CoreTestRootElement>) {
        super(createCore);

        this._core.on("post-layout", this.handlePostLayout);
    }

    public static Frame = "\n$$$$FRAME$$$$\n";

    private get mockStdin() {
        return this._core.stdin as MockStdin;
    }
    private get mockStdout() {
        return this._core.stdout as MockStdout;
    }

    public emitResizeEvent = (
        type: "set" | "offset",
        { rows, columns }: { rows: number; columns: number },
    ): void => {
        this.mockStdout.emitResizeEvent(type, { rows, columns });
    };

    public sendStdinData(data: Buffer | string): void {
        this.mockStdin.sendStdinData(data);
    }

    private handlePostLayout = (canvas: Canvas) => {
        const frame = GridConverter.stringifyGrid(canvas.grid).output;
        if (frame !== this.frames[this.frames.length - 1]) {
            this.frames.push(frame);
        }

        const op = this.operations.pop();
        if (op) {
            if (typeof op === "function") {
                op();
            } else {
                this.sendStdinData(op);
            }
        }

        if (!op) {
            this.exit();
        }
    };
}
