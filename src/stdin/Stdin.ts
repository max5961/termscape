import { EventEmitter } from "node:events";
import { ActionStore, InputState } from "term-keymap";
import { EventEmitterMap } from "../types.js";
import { MouseState } from "./MouseState.js";

export const Emitter = new EventEmitter<EventEmitterMap>();

export class Stdin {
    private store: ActionStore;
    private inputState: InputState;
    private mouseState: MouseState;

    constructor() {
        this.store = new ActionStore();
        this.inputState = new InputState();
        this.mouseState = new MouseState();

        this.store.subscribe({
            name: "quit",
            keymap: "<C-c>",
            callback: () => process.exit(),
        });
    }

    public listen() {
        process.stdin.on("data", this.handleBuffer);
    }

    public pause() {
        process.stdin.off("data", this.handleBuffer);
    }

    private handleBuffer(buf: Buffer) {
        const { data } = this.inputState.process(buf, this.store.getActions());
        this.mouseState.process(data);
    }
}
