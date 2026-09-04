import type { StdinLike, StdoutLike } from "../../Types.js";
import type { CoreRootElement } from "../CoreRootElement.js";
import { KeyMapState, MouseState, type Action } from "term-keymap";
import type { RuntimeConstants } from "./RuntimeConstants.js";
import type { IActions } from "../ActionStore.js";

export class RuntimeStdin implements IActions {
    private readonly root: CoreRootElement;
    private readonly keymapState: KeyMapState;
    private readonly mouseState: MouseState;
    private readonly stdout: StdoutLike;
    private readonly stdin: StdinLike;

    constructor(root: CoreRootElement, constants: RuntimeConstants) {
        this.root = root;
        this.keymapState = new KeyMapState();
        this.mouseState = new MouseState();
        this.stdout = constants.stdout;
        this.stdin = constants.stdin;
    }

    public get isTTY() {
        return this.stdin.isTTY;
    }

    public start() {
        if (!this.stdin.isTTY) return;

        this.stdin.setRawMode(true);
        this.stdin.resume();
        this.stdin.on("data", this.handleStdin);
    }

    public stop() {
        this.stdin.off("data", this.handleStdin);
        this.stdin.pause();
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

        resolveMousePosition(
            this.root.getLayoutHeight(),
            this.stdout as typeof process.stdout,
        ).then((events) => {
            if (!events) return;

            events.forEach((_e) => {
                // this.root.emit(e.type, e);
            });
        });
    };
}
