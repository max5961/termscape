import { setKittyProtocol, setMouse } from "term-keymap";
import { RuntimeEffect, type RuntimeOperations } from "./RuntimeEffect.js";
import type { StdinLike, StdoutLike } from "../../Types.js";

export interface IRuntimeStdinEffect {
    kittyKeyboard: boolean;
    mouse: boolean;
    mouseMode: 0 | 3;
}

export class RuntimeStdinEffect extends RuntimeEffect<IRuntimeStdinEffect> {
    private stdin: StdinLike;
    private stdout: StdoutLike;

    constructor(stdin: StdinLike, stdout: StdoutLike) {
        super();
        this.stdin = stdin;
        this.stdout = stdout;
    }

    protected override initialState: IRuntimeStdinEffect = {
        kittyKeyboard: true,
        mouse: true,
        mouseMode: 3,
    };

    protected override operations: RuntimeOperations<IRuntimeStdinEffect> = {
        kittyKeyboard: {
            set: (v) => {
                this.setKitty(v);
            },
            disable: () => {
                this.setKitty(false);
            },
        },
        mouse: {
            set: (v) => {
                this.setMouse(v, this.get("mouseMode"));
            },
            disable: () => {
                this.setMouse(false, this.get("mouseMode"));
            },
        },
        mouseMode: {
            set: (v) => {
                if (!this.get("mouse")) return;
                this.setMouse(true, v);
            },
            disable: () => {},
        },
    };

    private setKitty(v: boolean) {
        setKittyProtocol(
            v,
            this.stdout as NodeJS.WriteStream,
            this.stdin as NodeJS.ReadStream & { fd: 0 },
        );
    }

    private setMouse(v: boolean, mode: 0 | 3) {
        setMouse(v, this.stdout as NodeJS.WriteStream, mode);
    }
}
