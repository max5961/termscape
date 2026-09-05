import { Capture } from "log-goblin";
import type { CoreRootElement } from "../CoreRootElement.js";
import { Ansi } from "../Ansi.js";

export class RuntimeLifecycle {
    private root: CoreRootElement;
    private capture: Capture;

    constructor(root: CoreRootElement) {
        this.root = root;
        this.capture = new Capture();
    }

    public start() {
        this.root.runtime.stdout.on("resize", this.root.handleResize);
        this.root.runtime.stdout.setMaxListeners(Infinity);

        this.root.runtime.process.on("exit", this.root.exit);
        this.root.runtime.process.on("SIGINT", this.root.exit);

        this.capture.on("output", this.root.handleCapturedOutput);

        this.root.runtime.stdout.write(Ansi.cursor.hide);
    }

    public end() {
        this.root.runtime.stdout.off("resize", this.root.handleResize);
        this.root.runtime.stdout.setMaxListeners(10);
        this.root.runtime.process.off("exit", this.root.exit);
        this.root.runtime.process.off("SIGINT", this.root.exit);
        this.capture.off("output", this.root.handleCapturedOutput);
        this.root.runtime.stdout.write(Ansi.cursor.show);

        if (!this.root.runtime.altScreen) {
            this.root.runtime.stdout.write("\n");
        }
    }
}
