import type { WriteMode } from "../../Types.js";
import type { CoreRootElement } from "../CoreRootElement.js";
import { StateChange } from "../renderer/RenderStateChange.js";
import { CurrentRuntime } from "./CurrentRuntime.js";
import { RuntimeConstants, type IRuntimeConstants } from "./RuntimeConstants.js";
import { RuntimeStdin } from "./RuntimeStdin.js";
import { RuntimeTerminal, type IRuntimeTerminal } from "./RuntimeTerminal.js";

export interface IRuntime {
    // TODO
    // exitOnCtrlC: boolean;
    // TODO
    // exitForcesEndProc: boolean;
    debounceMs: number;
    writeMode: WriteMode;
}

export interface RuntimeControl extends IRuntimeConstants, IRuntimeTerminal, IRuntime {}

export type RuntimeSetup = Partial<RuntimeControl> & {
    startOnCreate?: boolean;
};

export class Runtime {
    private readonly root: CoreRootElement;
    public readonly runtimeConstants: RuntimeConstants;
    private readonly runtimeTerminal: RuntimeTerminal;
    public readonly runtimeStdin: RuntimeStdin;
    private active: boolean;
    private debounceMs: number;
    private writeMode: WriteMode;

    constructor(root: CoreRootElement, setup: RuntimeSetup) {
        this.root = root;
        this.runtimeConstants = new RuntimeConstants(this.root, setup);
        this.runtimeStdin = new RuntimeStdin(this.root, this.runtimeConstants);
        this.runtimeTerminal = new RuntimeTerminal(
            this.root,
            this.runtimeConstants,
            setup,
        );
        this.debounceMs = setup.debounceMs ?? 16;
        this.writeMode = setup.writeMode ?? "cell";
        this.active = false;
    }

    public get isActive() {
        return this.active;
    }

    public startRuntime() {
        if (this.active) return;
        CurrentRuntime.ref = this;
        this.active = true;
        this.runtimeConstants.start();
        this.runtimeTerminal.start();
        this.root.scheduleRender(StateChange.StartRuntime);
    }

    public endRuntime(error?: Error) {
        if (!this.active) return;
        this.active = false;
        this.runtimeConstants.end();
        this.runtimeTerminal.end();
        this.runtimeTerminal.cleanupStdin();
        CurrentRuntime.ref = undefined;

        if (error) {
            throw error;
        }
    }

    public requestStdinStream() {
        //
    }

    public createController(): RuntimeControl {
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

            get writeMode() {
                return runtime.writeMode;
            },
            set writeMode(v) {
                runtime.writeMode = v;
            },
        };
    }
}
