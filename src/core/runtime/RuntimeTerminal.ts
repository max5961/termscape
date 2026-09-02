import { setKittyProtocol, setMouse } from "term-keymap";
import type { StdinLike, StdoutLike } from "../../Types.js";
import { Ansi } from "../Ansi.js";
import type { CoreRootElement } from "../CoreRootElement.js";
import { objectKeys } from "../../util.js";

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
    private readonly state: IRuntimeTerminal;
    private readonly cleanupOps: Map<
        keyof IRuntimeTerminal,
        (endRuntime: boolean) => unknown
    >;
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
        this.cleanupOps = new Map();
        this.waitingOps = new Map();
        this.active = false;
        this.activeStdin = false;

        const defaultState: IRuntimeTerminal = {
            altScreen: setup.altScreen ?? false,
            kittyKeyboardProtocol: setup.kittyKeyboardProtocol ?? true,
            mouse: setup.mouse ?? true,
            mouseMode: setup.mouseMode ?? 3,
        };
        this.state = {} as IRuntimeTerminal;
        for (const key of objectKeys(defaultState)) {
            this.set(key, defaultState[key]);
        }
    }

    public start() {
        this.active = true;
        this.performWaitingOp("altScreen");
    }

    public end() {
        this.active = false;
        this.performCleanupOp("altScreen", true);
    }

    public setupStdin() {
        this.activeStdin = true;
        this.performWaitingOp("kittyKeyboardProtocol");
        this.performWaitingOp("mouse");
        this.performWaitingOp("mouseMode");
    }

    public cleanupStdin() {
        this.activeStdin = false;
        this.performCleanupOp("kittyKeyboardProtocol", false);
        this.performCleanupOp("mouse", false);
        this.performCleanupOp("mouseMode", false);
    }

    public set = <T extends keyof IRuntimeTerminal>(
        prop: T,
        value: IRuntimeTerminal[T],
    ) => {
        const prev = this.state[prop];
        if (prev === value) return;
        this.state[prop] = value;

        if (prop === "altScreen") {
            if (!this.active) {
                return this.waitingOps.set("altScreen", this.performAltScreenOperation);
            }
            return this.performAltScreenOperation();
        }

        let operation: () => unknown;
        if (prop === "kittyKeyboardProtocol") {
            operation = this.performKittyOperation;
        } else if (prop === "mouse") {
            operation = this.performEnableMouseOperation;
        } else {
            operation = this.performMouseModeOperation;
        }

        if (!this.activeStdin) {
            return this.waitingOps.set(prop, operation);
        }
        operation();
    };

    public get = <T extends keyof IRuntimeTerminal>(prop: T): IRuntimeTerminal[T] => {
        return this.state[prop];
    };

    private performAltScreenOperation = () => {
        if (this.state.altScreen) {
            this.enterAltScreen();
            this.cleanupOps.set("altScreen", this.exitAltScreen);
        } else if (this.isApplied("altScreen")) {
            this.exitAltScreen();
            this.cleanupOps.delete("altScreen");
        }
    };

    private performKittyOperation = () => {
        const setKitty = (v: boolean) => {
            setKittyProtocol(
                v,
                this.stdout as NodeJS.WriteStream,
                this.stdin as NodeJS.ReadStream & { fd: 0 },
            );
        };

        if (this.state.kittyKeyboardProtocol) {
            setKitty(true);
            this.cleanupOps.set("kittyKeyboardProtocol", () => setKitty(false));
        } else if (this.isApplied("kittyKeyboardProtocol")) {
            setKitty(false);
            this.cleanupOps.delete("kittyKeyboardProtocol");
        }
    };

    private performEnableMouseOperation = () => {
        if (this.state.mouse) {
            this.setMouse(true);
            this.cleanupOps.set("mouse", () => this.setMouse(false));
        } else if (this.isApplied("mouse")) {
            this.setMouse(false);
            this.cleanupOps.delete("mouse");
        }
    };

    private performMouseModeOperation = () => {
        if (this.state.mouse) {
            this.setMouse(this.state.mouse);
        }
    };

    private enterAltScreen = () => {
        this.stdout.write(Ansi.enterAltScreen);
        this.stdout.write(Ansi.cursor.position(1, 1));
        this.root.scheduleRender();
    };

    private exitAltScreen = (endRuntime?: boolean) => {
        this.stdout.write(Ansi.exitAltScreen);
        if (!endRuntime) {
            this.root.scheduleRender();
        }
    };

    private setMouse = (enable: boolean) => {
        setMouse(enable, this.stdout as NodeJS.WriteStream, this.state.mouseMode);
    };

    /**
     * A cleanup only exists when an operation is performed and sets a cleanup
     * operation. Therefore, if a cleanup operation does not exist, then we know
     * we are in the default terminal state.  This means that we don't need to
     * exit the alt screen for example if there is no cleanup.  Suppose we did:
     *
     * runtime.altScreen = true;
     * runtime.altScreen = false;
     * runtime.start();
     *
     * There would be a waiting op for altScreen from setting to false.  Then,
     * since the op enter the altscreen was never actually performed there is no
     * cleanup and no need to send escape codes to bring back to the state we are
     * already in.
     * */
    private isApplied = <T extends keyof IRuntimeTerminal>(prop: T) => {
        return !!this.cleanupOps.get(prop);
    };

    private performWaitingOp = <T extends keyof IRuntimeTerminal>(prop: T) => {
        const op = this.waitingOps.get(prop);
        if (op) {
            op();
            this.waitingOps.delete(prop);
        }
    };

    private performCleanupOp = <T extends keyof IRuntimeTerminal>(
        prop: T,
        endRuntime: boolean,
    ) => {
        const op = this.cleanupOps.get(prop);
        if (op) {
            op(endRuntime);
            this.cleanupOps.delete(prop);
        }
    };
}
