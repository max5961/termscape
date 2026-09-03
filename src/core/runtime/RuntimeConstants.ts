import { Capture } from "log-goblin";
import type { ProcessLike, StdinLike, StdoutLike } from "../../Types.js";
import type { CoreRootElement } from "../CoreRootElement.js";

export interface IRuntimeConstants {
    readonly process: ProcessLike;
    readonly stdout: StdoutLike;
    readonly stdin: StdinLike;
}

export class RuntimeConstants implements IRuntimeConstants {
    private readonly _process: ProcessLike;
    private readonly _stdout: StdoutLike;
    private readonly _stdin: StdinLike;
    private readonly root: CoreRootElement;
    private cleanup: (() => unknown) | undefined;

    constructor(root: CoreRootElement, setup: Partial<IRuntimeConstants>) {
        this.root = root;
        this._process = setup.process ?? process;
        this._stdout = setup.stdout ?? this._process.stdout;
        this._stdin = setup.stdin ?? this._process.stdin;
    }

    public get process() {
        return this._process;
    }
    public get stdout() {
        return this._stdout;
    }
    public get stdin() {
        return this._stdin;
    }

    public start() {
        this.stdout.on("resize", this.root.handleResize);
        this.stdout.setMaxListeners(Infinity);

        const capture = new Capture();
        capture.on("output", this.root.handleCapturedOutput);

        this.process.on("exit", this.root.exit);
        this.process.on("SIGINT", this.root.exit);

        this.cleanup = () => {
            this.stdout.off("resize", this.root.handleResize);
            this.stdout.setMaxListeners(10);
            capture.off("output", this.root.handleCapturedOutput);
            this.process.off("exit", this.root.exit);
            this.process.off("SIGINT", this.root.exit);
        };
    }

    public end() {
        this.cleanup?.();
    }
}
