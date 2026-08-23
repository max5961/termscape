import {
    configureStdin,
    KeyMapState,
    MouseState,
    setKittyProtocol,
    setMouse,
    type Action,
} from "term-keymap";
import type { Root } from "../dom/RootElement.js";
import { Capture } from "log-goblin";
import { Ansi } from "./Ansi.js";
import { Scheduler, TestScheduler } from "./Scheduler.js";
import { TEST_ROOT_ELEMENT } from "../Constants.js";
import { handleError } from "./ThrowError.js";
import type { DomElement } from "../dom/DomElement.js";
import type { InputElement } from "../dom/InputElement.js";
import { logger } from "./Logger.js";

export interface IRuntimeService {
    /** Renders occur at an interval no faster than `debounceMs` ms. */
    debounceMs: number;
    /** Use terminal's alt screen buffer. Preserve main screen. */
    altScreen: boolean;
    /** `Ctrl + c` ends the runtime for this Root. */
    exitOnCtrlC: boolean;
    /** Forces process exit after this Root's runtime ends. Skips `waitUntilExit` promises. */
    exitForcesEndProc: boolean;
    /** Experimental - rewrites only cells that are diffed from prev rendered output. */
    writeMode: "cell" | "row" | "refresh";

    stdin: NodeJS.ReadStream & { fd: 0 };

    stdout: NodeJS.WriteStream;

    enableMouse: boolean;

    mouseMode: 0 | 3;

    enableKittyProtocol: boolean;
}

export interface IRuntimeState extends IRuntimeService {
    hasStarted: boolean;
    hasRequestedStdin: boolean;
}

export type RuntimeConfig = Partial<
    IRuntimeService & {
        /** If this is `false`, runtime can be explictly started at any given time with `Root.startRuntime`. */
        startOnCreate: boolean;
    }
>;

let LatestEndRuntime: RuntimeService["endRuntime"] = () => {};

process.on("exit", () => {
    LatestEndRuntime(undefined, true);
});
process.on("SIGINT", () => {
    LatestEndRuntime();
    process.exit(); // force exit after cleanup
});

export class RuntimeService implements IRuntimeService {
    private root: Root;
    private initialState: IRuntimeState;
    private state: IRuntimeState;
    private keymapState: KeyMapState;
    private mouseState: MouseState;
    private cleanupHandlers: Map<
        keyof IRuntimeState,
        ((endRuntime: boolean) => unknown)[]
    >;
    private exitResolvers: { promise: Promise<void>; resolver: () => void }[];
    public scheduler: Scheduler;
    private inputStreamOwner: InputElement | undefined;

    private static ExitOnCtrlCAction: Action = {
        keymap: { key: ["ctrl"], input: "c" },
        callback: () => {
            LatestEndRuntime();
        },
    };

    constructor(root: Root, config: RuntimeConfig) {
        this.root = root;
        this.exitResolvers = [];
        this.keymapState = new KeyMapState();
        this.mouseState = new MouseState();
        this.cleanupHandlers = new Map();
        this.scheduler = this.root._is(TEST_ROOT_ELEMENT)
            ? new TestScheduler(this.root)
            : new Scheduler();
        this.initialState = {
            debounceMs: config.debounceMs ?? 16,
            altScreen: config.altScreen ?? false,
            exitOnCtrlC: config.exitOnCtrlC ?? true,
            exitForcesEndProc: config.exitForcesEndProc ?? false,
            stdout: config.stdout ?? process.stdout,
            stdin: config.stdin ?? process.stdin,
            enableMouse: config.enableMouse ?? false,
            mouseMode: config.mouseMode ?? 3,
            enableKittyProtocol: config.enableKittyProtocol ?? true,
            writeMode: config.writeMode ?? "cell",
            hasStarted: false,
            hasRequestedStdin: false,
        };
        this.state = { ...this.initialState };

        LatestEndRuntime = this.endRuntime.bind(this);
    }

    public getState(): Readonly<IRuntimeState> {
        return this.state;
    }

    private get actions() {
        return this.root._register.actions;
    }

    public setInputStreamOwner(owner: InputElement | undefined) {
        this.inputStreamOwner = owner;
        if (this.inputStreamOwner && !this.state.hasRequestedStdin) {
            this.refreshStdin({
                ...this.state,
                hasRequestedStdin: true,
            });
        }
    }

    public getInputStreamOwner() {
        return this.inputStreamOwner;
    }

    private pushCleanup(key: keyof IRuntimeState, cb: (endRuntime: boolean) => unknown) {
        if (!this.cleanupHandlers.get(key)) {
            this.cleanupHandlers.set(key, []);
        }
        this.cleanupHandlers.get(key)!.push(cb);
    }

    private execCleanup(key: keyof IRuntimeState, endRuntime = false) {
        this.cleanupHandlers.get(key)?.forEach((c) => c(endRuntime));
        this.cleanupHandlers.set(key, []);
    }

    private execAllCleanup(endRuntime: boolean) {
        this.cleanupHandlers.forEach((handlers) => {
            handlers.forEach((h) => h(endRuntime));
        });
        this.cleanupHandlers = new Map();
    }

    private handleStdin = (buf: Buffer) => {
        this.scheduler.execWhenFree(() => {
            if (this.inputStreamOwner) {
                return this.inputStreamOwner.handleData(buf);
            }

            this.updateActions();
            const { data } = this.keymapState.process(buf);
            this.mouseState.process(data);
        });
    };

    /** this is garbage but for now */
    private updateActions() {
        this.keymapState.clearActions();
        for (const [el, actions] of this.actions) {
            if (el.getFocus()) {
                actions.forEach((a) => this.keymapState.addAction(a));
            }
        }

        if (this.exitOnCtrlC) {
            this.keymapState.addAction(RuntimeService.ExitOnCtrlCAction);
        }
    }

    public startRuntime() {
        if (this.state.hasStarted) return;
        this.state.hasStarted = true;

        this.refresh(this.state, {});

        if (process.env.CURSOR_DEBUG !== "true") {
            this.state.stdout.write(Ansi.cursor.hide);
        }
    }

    public endRuntime(error?: Error, isBeforeExit?: boolean) {
        if (!this.state.hasStarted) return;
        this.state.hasStarted = false;

        this.state.stdout.write("\n"); // cursor stays on final row
        this.stdout.write(Ansi.cursor.show);
        this.execAllCleanup(true);

        if (error) {
            return handleError(error);
        }

        const resolvers = this.exitResolvers.map((o) => o.resolver);
        const promises = this.exitResolvers.map((o) => o.promise);

        Promise.all(promises).then(() => {
            if (this.state.exitForcesEndProc && !isBeforeExit) {
                process.exit();
            }
        });
        resolvers.forEach((r) => r());
        this.exitResolvers = [];
    }

    private refresh(next: IRuntimeState, prev?: Partial<IRuntimeState>) {
        prev ??= this.state;
        this.state = next;
        if (!this.state.hasStarted) return;

        if (prev.stdout !== next.stdout) {
            this.handleStdoutChange(next);
        }

        if (prev.altScreen !== next.altScreen || prev.stdout !== next.stdout) {
            this.handleScreenChange(next);
        }

        if (prev.exitOnCtrlC !== next.exitOnCtrlC) {
            this.handleExitOnCtrlCChange(next);
        }

        if (
            prev.stdin !== next.stdin ||
            prev.enableMouse !== next.enableMouse ||
            prev.mouseMode !== next.mouseMode ||
            prev.enableKittyProtocol !== next.enableKittyProtocol
        ) {
            this.refreshStdin(next);
        }

        // cursor is NOT moving down here like it should
        this.root.scheduleRender({ screenChange: true });
    }

    private handleStdoutChange(next: IRuntimeState) {
        this.execCleanup("stdout");

        const handleResize = () => {
            this.root._canvas.updateRootConstraints();
            this.root.scheduleRender({ resize: true });
        };
        next.stdout.on("resize", handleResize);
        next.stdout.setMaxListeners(Infinity);

        const handleOutput = (data: string) => {
            this.root.scheduleRender({ capturedOutput: data });
        };
        const capture = new Capture();
        capture.start();
        capture.on("output", handleOutput);

        this.pushCleanup("stdout", () => {
            next.stdout.off("resize", handleResize);
            next.stdout.setMaxListeners(10); // the default
            capture.off("output", handleOutput);
            capture.stop();
        });

        // if stdout changes, we should consider it effectively a layout change
        handleResize();
    }

    private refreshStdin(next: IRuntimeState) {
        this.execCleanup("stdin");
        if (!next.hasRequestedStdin) return;

        configureStdin(next);
        next.stdin.resume();
        next.stdin.on("data", this.handleStdin);

        this.pushCleanup("stdin", () => {
            setKittyProtocol(false, next.stdout, next.stdin);
            setMouse(false, next.stdout);
            next.stdin.pause();
            next.stdin.off("data", this.handleStdin);
        });
    }

    private handleScreenChange(next: IRuntimeState) {
        this.execCleanup("altScreen");

        const enterAltScreen = () => {
            next.stdout.write(Ansi.enterAltScreen);
            next.stdout.write(Ansi.cursor.position(1, 1));
            this.root.render({ screenChange: true });
        };

        const exitAltScreen = (endRuntime: boolean) => {
            next.stdout.write(Ansi.exitAltScreen);
            if (!endRuntime) {
                this.root.render({ screenChange: true });
            }
        };

        if (next.altScreen) {
            enterAltScreen();
            this.pushCleanup("altScreen", exitAltScreen);
        }
    }

    private handleExitOnCtrlCChange(next: IRuntimeState) {
        if (next.exitOnCtrlC) {
            this.keymapState.addAction(RuntimeService.ExitOnCtrlCAction);
        } else {
            this.keymapState.removeAction(RuntimeService.ExitOnCtrlCAction);
        }
    }

    public requestStdin() {
        if (this.state.hasRequestedStdin) return;
        this.state.hasRequestedStdin = true;

        if (this.state.hasStarted) {
            this.refreshStdin({
                ...this.state,
            });
        }
    }

    public createExitResolver(): Promise<void> {
        let resolver: () => void;
        const p = new Promise<void>((res) => {
            resolver = res;
        });
        this.exitResolvers.push({ promise: p, resolver: () => resolver() });
        return p;
    }

    // API

    set altScreen(v: IRuntimeService["altScreen"]) {
        if (this.state.altScreen === v) return;
        this.refresh({
            ...this.state,
            altScreen: v,
        });
    }
    set exitOnCtrlC(v: IRuntimeService["exitOnCtrlC"]) {
        if (this.state.exitOnCtrlC === v) return;
        this.refresh({
            ...this.state,
            exitOnCtrlC: v,
        });
    }
    set exitForcesEndProc(v: IRuntimeService["exitForcesEndProc"]) {
        if (this.state.exitForcesEndProc === v) return;
        this.refresh({
            ...this.state,
            exitForcesEndProc: v,
        });
    }
    set stdout(v: IRuntimeService["stdout"]) {
        if (this.state.stdout === v) return;
        this.refresh({
            ...this.state,
            stdout: v,
        });
    }
    set stdin(v: IRuntimeService["stdin"]) {
        if (this.state.stdin === v) return;
        this.refresh({
            ...this.state,
            stdin: v,
        });
    }
    set enableMouse(v: IRuntimeService["enableMouse"]) {
        if (v === this.state.enableMouse) return;
        this.refresh({
            ...this.state,
            enableMouse: v,
        });
    }
    set mouseMode(v: IRuntimeService["mouseMode"]) {
        if (v === this.state.mouseMode) return;
        this.refresh({
            ...this.state,
            mouseMode: v,
        });
    }
    set enableKittyProtocol(v: IRuntimeService["enableKittyProtocol"]) {
        if (v === this.state.enableKittyProtocol) return;
        this.refresh({
            ...this.state,
            enableKittyProtocol: v,
        });
    }
    // these are accessed at runtime and don't need any setup
    set writeMode(v: IRuntimeService["writeMode"]) {
        this.state.writeMode = v;
    }
    set debounceMs(v: IRuntimeService["debounceMs"]) {
        if (this.state.debounceMs === v) return;
        this.state.debounceMs = v;
        this.scheduler.debounceMs = v;
    }

    get altScreen() {
        return this.state.altScreen;
    }
    get exitOnCtrlC() {
        return this.state.exitOnCtrlC;
    }
    get exitForcesEndProc() {
        return this.state.exitForcesEndProc;
    }
    get stdout() {
        return this.state.stdout;
    }
    get stdin() {
        return this.state.stdin;
    }
    get enableMouse() {
        return this.state.enableMouse;
    }
    get mouseMode() {
        return this.state.mouseMode;
    }
    get enableKittyProtocol() {
        return this.state.enableKittyProtocol;
    }
    get writeMode() {
        return this.state.writeMode;
    }
    get debounceMs() {
        return this.state.debounceMs;
    }
}
