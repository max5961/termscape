import { Action } from "term-keymap";
import { Root } from "./BaseElement.js";
import { setMouse } from "term-keymap";
import { Scheduler } from "./Scheduler.js";
import { Ansi } from "../util/Ansi.js";
import { Stdin } from "../stdin/Stdin.js";
import { RuntimeConfig } from "../types.js";

type TrimStart<S extends string> = S extends `_${infer Rest}` ? Rest : S;
type _RuntimeConfig = {
    [P in `_${keyof RuntimeConfig}`]-?: Exclude<RuntimeConfig[TrimStart<P>], undefined>;
};

export class Runtime implements _RuntimeConfig {
    public _debounceMs: number;
    public _altScreen: boolean;
    public _exitOnCtrlC: boolean;
    public _stdout: NodeJS.WriteStream;
    public _stdin: NodeJS.ReadStream & { fd: 0 };
    public _enableMouse: boolean;
    public _mouseMode: 0 | 3;
    public _enableKittyProtocol: boolean;

    private rootInst: Root;
    private schedulerInst: Scheduler;
    private stdinInst: Stdin;
    private endRuntimeAction: Action;
    private prevScreenWasAlt: boolean;

    constructor(rootInst: Root, schedulerInst: Scheduler, stdinInst: Stdin) {
        this._debounceMs = 16;
        this._altScreen = false;
        this._exitOnCtrlC = true;
        this._stdout = process.stdout;
        this._stdin = process.stdin;
        this._enableMouse = false;
        this._mouseMode = 3;
        this._enableKittyProtocol = true;

        this.rootInst = rootInst;
        this.schedulerInst = schedulerInst;
        this.stdinInst = stdinInst;

        this.prevScreenWasAlt = this._altScreen;
        this.endRuntimeAction = {
            keymap: "<C-c>",
            callback: () => rootInst.endRuntime(),
        };
    }

    public pauseStdin() {
        this.stdinInst.pause();
    }

    public resumeStdin() {
        this.stdinInst.listen();
    }

    private handleScreenChange(render = true) {
        // DEFAULT_SCREEN --> ALT_SCREEN
        if (!this.prevScreenWasAlt && this.altScreen) {
            this.stdout.write(Ansi.enterAltScreen);
            this.stdout.write(Ansi.cursor.position(1, 1));
            this.rootInst.render({ screenChange: true });
        }

        // ALT_SCREEN --> DEFAULT_SCREEN
        else if (this.prevScreenWasAlt && !this.altScreen) {
            this.stdout.write(Ansi.exitAltScreen);
            if (render) {
                this.rootInst.render({ screenChange: true });
            }
        }
    }

    // =========================================================================
    // Setters
    // =========================================================================

    public set debounceMs(ms: number) {
        this._debounceMs = ms;
        this.schedulerInst.debounceMs = ms;
    }

    public set altScreen(val: boolean) {
        this.prevScreenWasAlt = this._altScreen;
        this._altScreen = val;
        this.handleScreenChange();
    }

    public set exitOnCtrlC(val: boolean) {
        this._exitOnCtrlC = val;

        if (val) {
            this.stdinInst.subscribe(this.endRuntimeAction);
        } else {
            this.stdinInst.remove(this.endRuntimeAction);
        }
    }

    public set stdout(out: NodeJS.WriteStream) {
        this._stdout = out;
    }

    public set stdin(input: typeof process.stdin) {
        this._stdin = input;
        this.stdinInst.stdinStream = input;
    }

    public set mouseMode(mode: _RuntimeConfig["_mouseMode"]) {
        this._mouseMode = mode;
    }

    public set enableMouse(val: boolean) {
        this._enableMouse = val;
        setMouse(val, this.stdout, this.mouseMode);
    }

    // =========================================================================
    // Getters
    // =========================================================================

    public get enableMouse(): Runtime["_enableMouse"] {
        return this._enableMouse;
    }

    public get mouseMode(): Runtime["_mouseMode"] {
        return this._mouseMode;
    }

    public get enableKittyProtocol(): Runtime["_enableKittyProtocol"] {
        return this._enableKittyProtocol;
    }

    public get debounceMs(): Runtime["_debounceMs"] {
        return this._debounceMs;
    }

    public get altScreen(): Runtime["_altScreen"] {
        return this._altScreen;
    }

    public get exitOnCtrlC(): Runtime["_exitOnCtrlC"] {
        return this._exitOnCtrlC;
    }

    public get stdout(): Runtime["_stdout"] {
        return this._stdout;
    }

    public get stdin(): Runtime["_stdin"] {
        return this._stdin;
    }
}
