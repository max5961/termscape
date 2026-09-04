import { Capture } from "log-goblin";
import type { ProcessLike, StdoutLike } from "../../Types.js";
import type { CoreRootElement } from "../CoreRootElement.js";
import { Ansi } from "../Ansi.js";

export class RuntimeLifecycle {
    private root: CoreRootElement;
    private process: ProcessLike;
    private stdout: StdoutLike;
    private capture: Capture;

    constructor(root: CoreRootElement, process: ProcessLike, stdout: StdoutLike) {
        this.root = root;
        this.process = process;
        this.stdout = stdout;
        this.capture = new Capture();
    }

    public start() {
        this.stdout.on("resize", this.root.handleResize);
        this.stdout.setMaxListeners(Infinity);

        this.process.on("exit", this.root.exit);
        this.process.on("SIGINT", this.root.exit);

        this.capture.on("output", this.root.handleCapturedOutput);

        this.stdout.write(Ansi.cursor.hide);
    }

    public end() {
        this.stdout.off("resize", this.root.handleResize);
        this.stdout.setMaxListeners(10);
        this.process.off("exit", this.root.exit);
        this.process.off("SIGINT", this.root.exit);
        this.capture.off("output", this.root.handleCapturedOutput);
        this.stdout.write(Ansi.cursor.show);
        this.stdout.write("\n");
    }
}
