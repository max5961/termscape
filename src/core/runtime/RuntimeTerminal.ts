import { setKittyProtocol, setMouse } from "term-keymap";
import type { StdinLike, StdoutLike } from "../../Types.js";
import type { CoreRootElement } from "../CoreRootElement.js";
import { Ansi } from "../Ansi.js";
import { objectKeys } from "../../util.js";
import { StateChange } from "../renderer/RenderStateChange.js";

export interface IRuntimeTerminal {
    altScreen: boolean;
    kittyKeyboardProtocol: boolean;
    mouse: boolean;
    mouseMode: 0 | 3;
}

export class RuntimeTerminal {
    private readonly root: CoreRootElement;
    private readonly stdout: StdoutLike;
    private readonly stdin: StdinLike;
    private state: IRuntimeTerminal;
    private readonly waitingOps: Map<keyof IRuntimeTerminal, () => unknown>;
    private active: boolean;
    private activeStdin: boolean;

    constructor(
        root: CoreRootElement,
        stdout: StdoutLike,
        stdin: StdinLike,
        setup: Partial<IRuntimeTerminal>,
    ) {
        this.root = root;
        this.stdout = stdout;
        this.stdin = stdin;
        this.waitingOps = new Map();
        this.active = false;
        this.activeStdin = false;

        const initialState: IRuntimeTerminal = {
            altScreen: setup.altScreen ?? false,
            kittyKeyboardProtocol: setup.kittyKeyboardProtocol ?? true,
            mouse: setup.mouse ?? true,
            mouseMode: setup.mouseMode ?? 3,
        };

        this.state = {
            altScreen: false,
            kittyKeyboardProtocol: false,
            mouse: false,
            mouseMode: 3,
        };

        for (const key of objectKeys(initialState)) {
            this.set(key, initialState[key]);
        }
    }

    public start() {
        this.active = true;
        this.stdout.write(Ansi.cursor.hide);
        this.performWaitingOp("altScreen");
    }

    public end() {
        this.active = false;
        const prev = { ...this.state };

        // return to normal screen.  if stdin is setup again the operation to
        // return to previous state is deferred until next start
        this.setAltScreen(false, { shouldDefer: false });
        this.setAltScreen(prev.altScreen, { shouldDefer: true });

        this.stdout.write(Ansi.cursor.show);
        if (!prev.altScreen) {
            this.stdout.write("\n");
        }
    }

    public setupStdin() {
        this.activeStdin = true;
        this.performWaitingOp("kittyKeyboardProtocol");
        this.performWaitingOp("mouse");
    }

    public cleanupStdin() {
        this.activeStdin = false;
        const prev = { ...this.state };

        this.setKittyKeyboard(false, { shouldDefer: false });
        this.setMouse(false, { shouldDefer: false });

        this.setKittyKeyboard(prev.kittyKeyboardProtocol, { shouldDefer: true });
        this.setMouse(prev.mouse, { shouldDefer: true });
    }

    public set = <T extends keyof IRuntimeTerminal>(
        prop: T,
        value: IRuntimeTerminal[T],
    ) => {
        if (prop === "altScreen") {
            return this.setAltScreen(value as IRuntimeTerminal["altScreen"]);
        }
        if (prop === "mouse") {
            return this.setMouse(value as IRuntimeTerminal["mouse"]);
        }
        if (prop === "mouseMode") {
            return this.setMouseMode(value as IRuntimeTerminal["mouseMode"]);
        }
        if (prop === "kittyKeyboardProtocol") {
            return this.setKittyKeyboard(
                value as IRuntimeTerminal["kittyKeyboardProtocol"],
            );
        }
    };

    public get = <T extends keyof IRuntimeTerminal>(prop: T) => {
        return this.state[prop];
    };

    private setAltScreen(
        v: IRuntimeTerminal["altScreen"],
        opts?: { shouldDefer: boolean },
    ) {
        const wrapper = (v: IRuntimeTerminal["altScreen"]) => {
            if (this.state.altScreen === v) return;
            this.state.altScreen = v;

            if (v) {
                this.enterAltScreen();
            } else {
                this.exitAltScreen();
            }
        };
        const deferWrapper = () => this.waitingOps.set("altScreen", () => wrapper(v));

        if (opts && !opts.shouldDefer) {
            return wrapper(v);
        }
        if (opts && opts.shouldDefer) {
            return deferWrapper();
        }
        if (this.active) {
            return wrapper(v);
        }
        return deferWrapper();
    }

    private setKittyKeyboard(
        v: IRuntimeTerminal["kittyKeyboardProtocol"],
        opts?: { shouldDefer: boolean },
    ) {
        const wrapper = (v: IRuntimeTerminal["kittyKeyboardProtocol"]) => {
            if (this.state.kittyKeyboardProtocol === v) return;
            this.state.kittyKeyboardProtocol = v;
            setKittyProtocol(
                v,
                this.stdout as NodeJS.WriteStream,
                this.stdin as NodeJS.ReadStream & { fd: 0 },
            );
        };
        const deferWrapper = () =>
            this.waitingOps.set("kittyKeyboardProtocol", () => wrapper(v));

        if (opts && !opts.shouldDefer) {
            return wrapper(v);
        }
        if (opts && opts.shouldDefer) {
            return deferWrapper();
        }
        if (this.activeStdin) {
            return wrapper(v);
        }
        return deferWrapper();
    }

    private setMouse(v: IRuntimeTerminal["mouse"], opts?: { shouldDefer: boolean }) {
        const wrapper = (v: IRuntimeTerminal["mouse"]) => {
            if (this.state.mouse === v) return;
            this.state.mouse = v;
            this.__setMouseHelper(v);
        };
        const deferWrapper = () => this.waitingOps.set("mouse", () => wrapper(v));

        if (opts && !opts.shouldDefer) {
            return wrapper(v);
        }
        if (opts && opts.shouldDefer) {
            return deferWrapper();
        }
        if (this.activeStdin) {
            return wrapper(v);
        }
        return deferWrapper();
    }

    private setMouseMode(v: IRuntimeTerminal["mouseMode"]) {
        if (this.state.mouseMode === v) return;
        this.state.mouseMode = v;

        if (this.activeStdin && this.state.mouse) {
            this.__setMouseHelper(this.state.mouse);
        }
    }

    private enterAltScreen = () => {
        this.stdout.write(Ansi.enterAltScreen);
        this.stdout.write(Ansi.cursor.position(0, 0));
        this.root.scheduleRender(StateChange.Screen);
    };

    private exitAltScreen = () => {
        this.stdout.write(Ansi.exitAltScreen);
    };

    private __setMouseHelper = (enable: boolean) => {
        setMouse(enable, this.stdout as NodeJS.WriteStream, this.state.mouseMode);
    };

    private performWaitingOp = <T extends keyof IRuntimeTerminal>(prop: T) => {
        const op = this.waitingOps.get(prop);
        op?.();
        this.waitingOps.delete(prop);
    };
}
