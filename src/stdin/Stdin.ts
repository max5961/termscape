import { EventEmitter } from "node:events";
import { configureStdin, ActionStore, InputState } from "term-keymap";
import { root } from "../dom/Root.js";
import { EventEmitterMap } from "../types.js";
import { MouseState } from "./MouseState.js";

configureStdin({
    stdout: process.stdout,
    mouseMode: 3,
    enableMouse: true,
    enableKittyProtocol: true,
});

const store = new ActionStore();
const inputState = new InputState();
const mouseState = new MouseState();

store.subscribe({
    name: "quit",
    keymap: "<C-c>",
    callback: () => process.exit(),
});

export const Emitter = new EventEmitter<EventEmitterMap>();

process.stdin.on("data", (buf: Buffer) => {
    const { data } = inputState.process(buf, store.getActions());

    mouseState.process(data);
});
