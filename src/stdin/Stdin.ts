import { EventEmitter } from "node:events";
import { Action, ActionStore, InputState } from "term-keymap";
import { EventEmitterMap } from "../types.js";
import { MouseState } from "./MouseState.js";
import { RuntimeConfig, Root } from "../dom/Root.js";
import { Ansi } from "../util/Ansi.js";

export const Emitter = new EventEmitter<EventEmitterMap>();

export class Stdin {
    private config: RuntimeConfig;
    private store: ActionStore;
    private inputState: InputState;
    private mouseState: MouseState;
    private endRuntime: Action;

    constructor(root: Root, config: RuntimeConfig) {
        this.config = config;
        this.store = new ActionStore();
        this.inputState = new InputState();
        this.mouseState = new MouseState(root);
        this.endRuntime = {
            name: "quit",
            keymap: "<C-c>",
            callback: () => {
                root.endRuntime();
            },
        };
    }

    public listen = () => {
        process.stdin.resume();
        process.stdin.on("data", this.handleBuffer);
    };

    public pause = () => {
        process.stdin.pause();
        process.stdin.off("data", this.handleBuffer);
        process.stdout.write(Ansi.restoreFromKittyProtocol);
    };

    private handleBuffer = (buf: Buffer) => {
        const { data } = this.inputState.process(buf, this.store.getActions());
        this.mouseState.process(data);
    };

    public subscribe(action: Action) {
        if (this.config.exitOnCtrlC) {
            this.store.subscribe(this.endRuntime);
        }
        return this.store.subscribe(action);
    }

    public remove(action: Action) {
        this.store.unsubscribe(action);
    }
}
