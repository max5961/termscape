import { KeyMapState, MouseState, type Action, type Data } from "term-keymap";
import type { CoreRootElement } from "../CoreRootElement.js";
import type { IActions } from "../ActionStore.js";

export class StdinProcessor implements IActions {
    private readonly root: CoreRootElement;
    private readonly keymapState: KeyMapState;
    private readonly mouseState: MouseState;
    private active: boolean;

    constructor(root: CoreRootElement) {
        this.root = root;
        this.keymapState = new KeyMapState();
        this.mouseState = new MouseState();
        this.active = false;
    }

    public start() {
        if (this.active || !this.root.runtime.stdin.isTTY) return;
        this.active = true;

        this.root.runtime.stdin.setRawMode(true);
        this.root.runtime.stdin.resume();
        this.root.runtime.stdin.on("data", this.handleStdin);
    }

    public stop() {
        if (!this.active || !this.root.runtime.stdin.isTTY) return;
        this.active = false;
        this.root.runtime.stdin.pause();
        this.root.runtime.stdin.off("data", this.handleStdin);
    }

    public addAction(action: Action) {
        this.keymapState.addAction(action);
    }

    public removeAction(action: Action) {
        this.keymapState.removeAction(action);
    }

    private handleStdin = (buf: Buffer) => {
        const { data } = this.keymapState.process(buf);
        const { resolveMousePosition } = this.mouseState.process(data);

        this.handlePossibleSigInt(data);

        resolveMousePosition(
            this.root.getLayoutHeight(),
            this.root.runtime.stdout as typeof process.stdout,
        ).then((events) => {
            if (!events) return;

            events.forEach((_e) => {
                // this.root.emit(e.type, e);
            });
        });
    };

    private handlePossibleSigInt(data: Data) {
        if (!this.root.runtime.exitOnCtrlC) {
            return;
        }
        if (!data.key.only("ctrl") && !data.input.only("c")) {
            return;
        }

        if (this.root.runtime.exitForcesEndProc) {
            this.root.process.exit();
        } else {
            this.root.exit();
        }
    }
}
