import type { ProcessLike, StdinLike, StdoutLike, WriteMode } from "../../Types.js";
import type { CoreRootElement } from "../CoreRootElement.js";
import { StateChange } from "../renderer/RenderStateChange.js";
import { CurrentRuntime } from "./CurrentRuntime.js";
import { RuntimeLifecycle } from "./RuntimeLifecycle.js";
import {
    RuntimeMutableEffect,
    type IRuntimeMutableEffect,
} from "./RuntimeMutableEffect.js";
import { RuntimeStdinEffect, type IRuntimeStdinEffect } from "./RuntimeStdinEffect.js";
import { StdinProcessor } from "./StdinProcessor.js";

export interface IRuntime {
    readonly process: ProcessLike;
    readonly stdout: StdoutLike;
    readonly stdin: StdinLike;
    // TODO
    // exitOnCtrlC: boolean;
    // TODO
    // exitForcesEndProc: boolean;
}
// this.debounceMs = setup.debounceMs ?? 16;
// this.writeMode = setup.writeMode ?? "cell";

interface IRuntimeValues {
    debounceMs: number;
    writeMode: WriteMode;
}

export interface RuntimeControl
    extends IRuntime,
        IRuntimeValues,
        IRuntimeMutableEffect,
        IRuntimeStdinEffect {}

export type RuntimeSetup = Partial<RuntimeControl> & {
    startOnCreate?: boolean;
};

export class Runtime {
    private readonly root: CoreRootElement;
    private active: boolean;
    private hasRequestedStdin: boolean;
    private readonly state: IRuntimeValues;
    private readonly process: ProcessLike;
    private readonly stdout: StdoutLike;
    private readonly stdin: StdinLike;
    private readonly mutableEffect: RuntimeMutableEffect;
    private readonly stdinEffect: RuntimeStdinEffect;
    private readonly lifecycle: RuntimeLifecycle;
    public readonly stdinProcessor: StdinProcessor;

    constructor(root: CoreRootElement, setup: RuntimeSetup) {
        this.root = root;
        this.active = false;
        this.hasRequestedStdin = false;
        this.process = setup.process ?? process;
        this.stdout = setup.stdout ?? this.process.stdout;
        this.stdin = setup.stdin ?? this.process.stdin;
        this.mutableEffect = new RuntimeMutableEffect(this.root, this.stdout);
        this.stdinEffect = new RuntimeStdinEffect(this.stdin, this.stdout);
        this.lifecycle = new RuntimeLifecycle(this.root, this.process, this.stdout);
        this.stdinProcessor = new StdinProcessor(this.root, this.stdout, this.stdin);

        this.state = {
            debounceMs: setup.debounceMs ?? 16,
            writeMode: setup.writeMode ?? "cell",
        };
    }

    public get isActive() {
        return this.active;
    }

    public startRuntime() {
        if (this.active) return;
        this.active = true;
        CurrentRuntime.ref = this;

        this.lifecycle.start();
        this.mutableEffect.start();

        if (this.hasRequestedStdin) {
            this.startStdin();
        }

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
        };
    }
}
