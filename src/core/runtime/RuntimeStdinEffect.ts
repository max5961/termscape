import { setKittyProtocol, setMouse } from "term-keymap";
import { RuntimeEffect, type RuntimeOperations } from "./RuntimeEffect.js";
import type { RuntimeControl } from "./Runtime.js";
import type { CoreRootElement } from "../CoreRootElement.js";
import type { _Pick } from "../../util.js";

type Effect = _Pick<RuntimeControl, "kittyKeyboard" | "mouse" | "mouseMode">;

export class RuntimeStdinEffect extends RuntimeEffect<Effect> {
    protected override readonly setupState: Effect;
    private root: CoreRootElement;

    constructor(root: CoreRootElement, setup: Partial<RuntimeControl>) {
        super();
        this.root = root;
        this.setupState = {
            kittyKeyboard: setup.kittyKeyboard ?? true,
            mouse: setup.mouse ?? true,
            mouseMode: setup.mouseMode ?? 3,
        };
    }

    protected override operations: RuntimeOperations<Effect> = {
        kittyKeyboard: {
            set: (v) => {
                this.setKitty(v);
            },
            disable: (v) => {
                if (v) {
                    this.setKitty(false);
                }
            },
            initialize: (v) => {
                if (v) {
                    this.setKitty(v);
                }
            },
        },
        mouse: {
            set: (v) => {
                this.setMouse(v, this.get("mouseMode"));
            },
            disable: (v) => {
                if (v) {
                    this.setMouse(false, this.get("mouseMode"));
                }
            },
            initialize: (v) => {
                if (v) {
                    this.setMouse(v, this.get("mouseMode"));
                }
            },
        },
        mouseMode: {
            set: (v) => {
                if (!this.get("mouse")) return;
                this.setMouse(true, v);
            },
            disable: () => {},
            initialize: (v) => {
                if (v !== undefined && this.get("mouse")) {
                    this.setMouse(true, v);
                }
            },
        },
    };

    private setKitty(v: boolean) {
        setKittyProtocol(
            v,
            this.root.runtime.stdout as NodeJS.WriteStream,
            this.root.runtime.stdin as NodeJS.ReadStream & { fd: 0 },
        );
    }

    private setMouse(v: boolean, mode: 0 | 3) {
        setMouse(v, this.root.runtime.stdout as NodeJS.WriteStream, mode);
    }
}
