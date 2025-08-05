import { EventEmitter } from "node:events";
import { ActionStore, InputState } from "term-keymap";
import { EventEmitterMap } from "../types.js";
import { MouseState } from "./MouseState.js";
import { Root, root } from "../dom/Root.js";

export const Emitter = new EventEmitter<EventEmitterMap>();

export class Stdin {
    private store: ActionStore;
    private inputState: InputState;
    private mouseState: MouseState;

    constructor(root: Root) {
        this.store = new ActionStore();
        this.inputState = new InputState();
        this.mouseState = new MouseState(root);

        // if (root.opts.exitOnCtrlC) {
        this.store.subscribe({
            name: "quit",
            keymap: "<C-c>",
            callback: () => {
                root.exit();
            },
        });
        // }
    }

    public listen = () => {
        process.stdin.resume();
        process.stdin.on("data", this.handleBuffer);
    };

    public pause = () => {
        process.stdin.pause();
        process.stdin.off("data", this.handleBuffer);
    };

    private handleBuffer = (buf: Buffer) => {
        const { data } = this.inputState.process(buf, this.store.getActions());
        this.mouseState.process(data);
    };
}
