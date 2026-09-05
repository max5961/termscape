import type { ProcessLike, StdinLike, StdoutLike, WriteMode } from "../../Types.js";
import type { _Pick, _Writable } from "../../util.js";
import type { CoreRootElement } from "../CoreRootElement.js";
import { StateChange } from "../renderer/RenderStateChange.js";
import { CurrentRuntime } from "./CurrentRuntime.js";
import { RuntimeLifecycle } from "./RuntimeLifecycle.js";
import { RuntimeMutableEffect } from "./RuntimeMutableEffect.js";
import { RuntimeStdinEffect } from "./RuntimeStdinEffect.js";
import { StdinProcessor } from "./StdinProcessor.js";

export interface IRuntime {
    readonly process: ProcessLike;
    readonly stdout: StdoutLike;
    readonly stdin: StdinLike;
    readonly altScreen: boolean;
    readonly mouse: boolean;
    readonly mouseMode: 0 | 3;
    readonly kittyKeyboard: boolean;
    readonly debounceMs: number;
    readonly writeMode: WriteMode;
    readonly exitOnCtrlC: boolean;
    readonly exitForcesEndProc: boolean;
    readonly ambiWidth: 1 | 2;
}

export type RuntimeControl = _Writable<IRuntime>;

// prettier-ignore
/**
 * runtime state that can be read by internal library code, but does not effect
 * terminal state by sending ANSI escape codes, and has little to no side effects
 * on runtime other than the intended effect of changing the option.
 * */
type PureRuntimeState = 
    _Pick<
        RuntimeControl,
        "debounceMs" | "writeMode" | "exitOnCtrlC" | "exitForcesEndProc" | "ambiWidth"
    >
    &
    _Pick<
        Readonly<RuntimeControl>, 
        "process" | "stdin" | "stdout"
    >;

export class Runtime implements IRuntime {
    private readonly root: CoreRootElement;
    private active: boolean;
    private hasRequestedStdin: boolean;
    private readonly state: PureRuntimeState;
    private readonly mutableEffect: RuntimeMutableEffect;
    private readonly stdinEffect: RuntimeStdinEffect;
    private readonly lifecycle: RuntimeLifecycle;
    public readonly stdinProcessor: StdinProcessor;

    constructor(root: CoreRootElement, setup: Partial<RuntimeControl>) {
        this.root = root;
        this.active = false;
        this.hasRequestedStdin = false;

        const proc = setup.process ?? process;
        const stdout = setup.stdout ?? proc.stdout;
        const stdin = setup.stdin ?? proc.stdin;
        this.state = {
            process: process,
            stdout: stdout,
            stdin: stdin,
            debounceMs: setup.debounceMs ?? 16,
            writeMode: setup.writeMode ?? "cell",
            exitOnCtrlC: setup.exitOnCtrlC ?? true,
            exitForcesEndProc: setup.exitForcesEndProc ?? false,
            ambiWidth: setup.ambiWidth ?? 2,
        };

        this.mutableEffect = new RuntimeMutableEffect(this.root, setup);
        this.stdinEffect = new RuntimeStdinEffect(this.root, setup);
        this.lifecycle = new RuntimeLifecycle(this.root);
        this.stdinProcessor = new StdinProcessor(this.root);
    }

    public get isActive() {
        return this.active;
    }

    public startRuntime() {
        if (this.active) return;
        this.active = true;
        CurrentRuntime.ref = this;

        if (this.hasRequestedStdin) {
            this.startStdin();
        }

        this.mutableEffect.start();
        this.lifecycle.start();

        this.root.scheduleRender(StateChange.StartRuntime);
    }

    public endRuntime(error?: Error) {
        if (!this.active) return;
        this.active = false;
        CurrentRuntime.ref = undefined;

        this.mutableEffect.end();
        this.stdinEffect.end();
        this.stdinProcessor.stop();
        this.lifecycle.end();

        if (error) {
            throw error;
        }
    }

    public requestStdinStream() {
        this.hasRequestedStdin = true;
        if (this.active) {
            this.startStdin();
        }
    }

    private startStdin() {
        this.stdinProcessor.start();
        this.stdinEffect.start();
    }

    public createController(): RuntimeControl {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const runtime = this;

        return {
            get process() {
                return runtime.process;
            },
            get stdout() {
                return runtime.stdout;
            },
            get stdin() {
                return runtime.stdin;
            },

            get altScreen() {
                return runtime.mutableEffect.get("altScreen");
            },
            set altScreen(v) {
                runtime.mutableEffect.set("altScreen", v);
            },

            get mouse() {
                return runtime.stdinEffect.get("mouse");
            },
            set mouse(v) {
                runtime.stdinEffect.set("mouse", v);
            },

            get mouseMode() {
                return runtime.stdinEffect.get("mouseMode");
            },
            set mouseMode(v) {
                runtime.stdinEffect.set("mouseMode", v);
            },

            get kittyKeyboard() {
                return runtime.stdinEffect.get("kittyKeyboard");
            },
            set kittyKeyboard(v) {
                runtime.stdinEffect.set("kittyKeyboard", v);
            },

            get debounceMs() {
                return runtime.state.debounceMs;
            },
            set debounceMs(v) {
                runtime.state.debounceMs = v;
            },

            get writeMode() {
                return runtime.state.writeMode;
            },
            set writeMode(v) {
                runtime.state.writeMode = v;
            },

            get exitOnCtrlC() {
                return runtime.state.exitOnCtrlC;
            },
            set exitOnCtrlC(v) {
                runtime.state.exitOnCtrlC = v;
            },

            get exitForcesEndProc() {
                return runtime.state.exitForcesEndProc;
            },
            set exitForcesEndProc(v) {
                runtime.state.exitForcesEndProc = v;
            },

            get ambiWidth() {
                return runtime.state.ambiWidth;
            },
            set ambiWidth(v) {
                runtime.state.ambiWidth = v;
            },
        };
    }

    get process() {
        return this.state.process;
    }
    get stdout() {
        return this.state.stdout;
    }
    get stdin() {
        return this.state.stdin;
    }
    get altScreen() {
        return this.mutableEffect.get("altScreen");
    }
    get mouse() {
        return this.stdinEffect.get("mouse");
    }
    get mouseMode() {
        return this.stdinEffect.get("mouseMode");
    }
    get kittyKeyboard() {
        return this.stdinEffect.get("kittyKeyboard");
    }
    get debounceMs() {
        return this.state.debounceMs;
    }
    get writeMode() {
        return this.state.writeMode;
    }
    get exitOnCtrlC() {
        return this.state.exitOnCtrlC;
    }
    get exitForcesEndProc() {
        return this.state.exitForcesEndProc;
    }
    get ambiWidth() {
        return this.state.ambiWidth;
    }
}
