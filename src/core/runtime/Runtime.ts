import type { CoreRootElement } from "../CoreRootElement.js";
import { RuntimeConstants, type IRuntimeConstants } from "./RuntimeConstants.js";
import { RuntimeTerminal, type IRuntimeTerminal } from "./RuntimeTerminal.js";

export interface IRuntime {
    // TODO
    // exitOnCtrlC: boolean;
    // TODO
    // exitForcesEndProc: boolean;
    debounceMs: number;
}

export interface RuntimeOptions extends IRuntimeConstants, IRuntimeTerminal, IRuntime {}

export type RuntimeSetup = Partial<RuntimeOptions> & {
    startOnCreate?: boolean;
};

export class Runtime implements IRuntime {
    private readonly root: CoreRootElement;
    private readonly runtimeConstants: RuntimeConstants;
    private readonly runtimeTerminal: RuntimeTerminal;
    private active: boolean;
    public debounceMs: number;

    constructor(root: CoreRootElement, setup: RuntimeSetup) {
        this.root = root;
        this.runtimeConstants = new RuntimeConstants(this.root, setup);
        this.runtimeTerminal = new RuntimeTerminal(
            this.root,
            this.runtimeConstants.stdout,
            this.runtimeConstants.stdin,
            setup,
        );
        this.debounceMs = setup.debounceMs ?? 16;
        this.active = false;
    }

    public startRuntime() {
        if (this.active) return;
        this.active = true;
        this.runtimeConstants.start();
        this.runtimeTerminal.start();
    }

    public endRuntime() {
        if (!this.active) return;
        this.active = false;
        this.runtimeConstants.end();
        this.runtimeConstants.end();
    }

    public createController(): RuntimeOptions {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const runtime = this;

        return {
            get process() {
                return runtime.runtimeConstants.process;
            },
            get stdout() {
                return runtime.runtimeConstants.stdout;
            },
            get stdin() {
                return runtime.runtimeConstants.stdin;
            },

            get altScreen() {
                return runtime.runtimeTerminal.get("altScreen");
            },
            set altScreen(v) {
                runtime.runtimeTerminal.set("altScreen", v);
            },

            get mouse() {
                return runtime.runtimeTerminal.get("mouse");
            },
            set mouse(v) {
                runtime.runtimeTerminal.set("mouse", v);
            },

            get mouseMode() {
                return runtime.runtimeTerminal.get("mouseMode");
            },
            set mouseMode(v) {
                runtime.runtimeTerminal.set("mouseMode", v);
            },

            get kittyKeyboardProtocol() {
                return runtime.runtimeTerminal.get("kittyKeyboardProtocol");
            },
            set kittyKeyboardProtocol(v) {
                runtime.runtimeTerminal.set("kittyKeyboardProtocol", v);
            },

            get debounceMs() {
                return runtime.debounceMs;
            },
            set debounceMs(v) {
                runtime.debounceMs = v;
            },
        };
    }
}
