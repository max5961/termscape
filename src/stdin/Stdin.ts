import { EventEmitter } from "node:events";
import { Action, ActionStore, InputState } from "term-keymap";
import { EventEmitterMap } from "../types.js";
import { MouseState } from "./MouseState.js";
import { Root } from "../dom/BaseElement.js";

export const Emitter = new EventEmitter<EventEmitterMap>();

export class Stdin {
    private store: ActionStore;
    private inputState: InputState;
    private mouseState: MouseState;
    private _stdin: typeof process.stdin;

    constructor(root: Root) {
        this.store = new ActionStore();
        this.inputState = new InputState();
        this.mouseState = new MouseState(root);
        this._stdin = process.stdin;
    }

    public listen = () => {
        this._stdin.resume();
        this._stdin.on("data", this.handleBuffer);
    };

    public pause = () => {
        this._stdin.pause();
        this._stdin.off("data", this.handleBuffer);
    };

    private handleBuffer = (buf: Buffer) => {
        const { data } = this.inputState.process(buf, this.store.getActions());
        this.mouseState.process(data);
    };

    public subscribe(action: Action) {
        return this.store.subscribe(action);
    }

    public remove(action: Action) {
        this.store.unsubscribe(action);
    }

    public set stdinStream(stdin: typeof process.stdin) {
        this.pause();
        this._stdin = stdin;
        this.listen();
    }
}
