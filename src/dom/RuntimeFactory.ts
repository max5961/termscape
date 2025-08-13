import {
    ActionStore,
    configureStdin,
    InputState,
    setKittyProtocol,
    setMouse,
    type Action,
} from "term-keymap";
import type { EventEmitterMap, RuntimeConfig } from "../types.js";
import { Ansi } from "../util/Ansi.js";
import { Capture } from "log-goblin";
import type { Root } from "./Root.js";
import { MouseState } from "../stdin/MouseState.js";
import type { Scheduler } from "./Scheduler.js";
import type { EventEmitter } from "stream";
import { DOM_ELEMENT_ACTIONS, DomElement } from "./DomElement.js";

type Config = Required<RuntimeConfig>;
export type RuntimeDependencies = {
    config: Partial<Config>;
    root: Root;
    scheduler: Scheduler;
    emitter: EventEmitter<EventEmitterMap>;
};

export type Runtime = ReturnType<typeof createRuntime>;

// Exiting the application should always be done through `endRuntime`, but
// forceful exits still need to be supported.  In case multiple root instances are
// used, then the only exit handler needed is the final one as the others will
// have already ended runtime.
const latestEndRuntime: { latest: () => void } = { latest: () => {} };
process.on("exit", () => {
    latestEndRuntime.latest();
});
process.on("SIGINT", () => {
    latestEndRuntime.latest();
});

/**
 * Runtime settings are handled here.  The purpose of this is to allow for
 * exiting the app gracefully when the call stack is empty. Returns a
 * getter/setter API for public usage and logic for private usage in the Root
 * class.  This should support runtime changes to any setting in RuntimeConfig.
 *
 * Escape sequences are all related to input handling.  Therefore, they only take
 * effect when listening for input and are restored to default when listening for
 * input is paused. Starting runtime also automatically applies escape sequences
 * which are set in the config.
 */
export function createRuntime(deps: RuntimeDependencies) {
    const root = deps.root;
    const scheduler = deps.scheduler;
    const config = deps.config as Config;

    config.debounceMs ??= 16;
    config.altScreen ??= false;
    config.exitOnCtrlC ??= true;
    config.stdout ??= process.stdout;
    config.stdin ??= process.stdin;
    config.enableMouse ??= false;
    config.mouseMode ??= 3;
    config.enableKittyProtocol ??= true;

    let cleanupHandlers = [] as (() => void)[];
    let isDefaultScreen = true;
    let isListening = false;
    let isStarted = false;

    const capture = new Capture();
    const inputState = new InputState();
    const mouseState = new MouseState(root, deps.emitter);

    /** Actions added through react layer (or the ctrl-c exit action) */
    const actionStore = new ActionStore();

    /** Used for dom layer */
    const actionElements = new Set<DomElement>();

    const exitAction: Readonly<Action> = {
        name: "internal_exit",
        keymap: "<C-c>",
        callback() {
            logic.endRuntime();
        },
    };

    const logic = {
        configureRuntime: (newConfig: RuntimeConfig) => {
            logic.endRuntime();
            Object.setPrototypeOf(config, newConfig);
            logic.startRuntime();
        },

        handleStdinBuffer: (buf: Buffer) => {
            const domActions = logic.getDomActions();
            const actions = actionStore.getCombinedActions(domActions);

            const { data } = inputState.process(buf, actions);
            mouseState.process(data);
        },

        getDomActions: () => {
            return Array.from(actionElements.values()).flatMap((elem) => {
                return elem[DOM_ELEMENT_ACTIONS].map((actions) => actions);
            });
        },

        startRuntime() {
            if (isStarted) return;
            isStarted = true;

            // Hide Cursor
            config.stdout.write(Ansi.cursor.hide);
            cleanupHandlers.push(() => config.stdout.write(Ansi.cursor.show));

            // Handle window resize
            config.stdout.on("resize", logic.handleResize);
            cleanupHandlers.push(() => config.stdout.off("resize", logic.handleResize));

            // Capture Console
            const onStdout = (data: string) => {
                root.scheduleRender({ capturedOutput: data });
            };
            capture.start();
            capture.on("stdout", onStdout);
            cleanupHandlers.push(() => {
                capture.off("stdout", onStdout);
                capture.stop();
            });

            // Initial settings
            api.exitOnCtrlC = config.exitOnCtrlC;
            api.altScreen = config.altScreen;
            api.debounceMs = config.debounceMs;
        },

        endRuntime() {
            if (!isStarted) return;
            isStarted = false;

            logic.enterDefaultScreen();
            logic.pauseStdin();

            cleanupHandlers.forEach((handler) => handler());
            cleanupHandlers = [];
        },

        resumeStdin: () => {
            if (isListening) return;
            isListening = true;

            try {
                configureStdin(config);
                config.stdin.resume();
                config.stdin.on("data", logic.handleStdinBuffer);
            } catch {
                console.warn("Term is not TTY. Unable to handle stdin.");
            }
        },

        pauseStdin: () => {
            if (!isListening) return;
            isListening = false;

            setKittyProtocol(false, config.stdout, config.stdin);
            setMouse(false, config.stdout);

            config.stdin.pause();
            config.stdin.off("data", logic.handleStdinBuffer);
        },

        addKeyListener: (action: Action) => {
            actionStore.subscribe(action);
            return () => actionStore.unsubscribe(action);
        },

        removeKeyListener: (action: Action) => {
            actionStore.unsubscribe(action);
        },

        enterAltScreen() {
            if (!isDefaultScreen) return;

            config.stdout.write(Ansi.enterAltScreen);
            config.stdout.write(Ansi.cursor.position(1, 1));
            isDefaultScreen = false;
            root.render({ screenChange: true });
        },

        enterDefaultScreen() {
            if (isDefaultScreen) return;
            config.stdout.write(Ansi.exitAltScreen);
            isDefaultScreen = true;
            root.render({ screenChange: true });
        },

        handleResize: () => {
            root.scheduleRender({ resize: true });
        },
    };

    const api = {
        // SETTERS
        set debounceMs(val: Config["debounceMs"]) {
            config.debounceMs = val;
            scheduler.debounceMs = val;
        },

        set altScreen(val: Config["altScreen"]) {
            config.altScreen = val;
            if (val) {
                logic.enterAltScreen();
            } else {
                logic.enterDefaultScreen();
            }
        },

        set exitOnCtrlC(val: Config["exitOnCtrlC"]) {
            config.exitOnCtrlC = val;
            if (val) {
                actionStore.subscribe(exitAction);
            } else {
                actionStore.unsubscribe(exitAction);
            }
        },

        set stdout(val: Config["stdout"]) {
            if (val === config.stdout) return;

            const wasDefaultScreen = isDefaultScreen;
            const wasListening = isListening;
            logic.endRuntime();
            config.stdout = val;
            logic.startRuntime();

            if (!wasDefaultScreen) {
                logic.enterAltScreen();
            }

            if (wasListening) {
                logic.resumeStdin();
            }

            // Changing stdout should be considered a screen change.
            root.render({ screenChange: true });
        },
        set stdin(val: Config["stdin"]) {
            if (val === config.stdin) return;

            const wasListening = isListening;
            logic.pauseStdin();
            config.stdin = val;

            if (wasListening) {
                logic.resumeStdin();
            }
        },

        // If not listening, these term modes will be set if/when stdin listening starts

        set enableMouse(val: Config["enableMouse"]) {
            if (val === config.enableMouse) return;

            config.enableMouse = val;
            if (isListening) {
                setMouse(val, config.stdout);
            }
        },
        set mouseMode(val: Config["mouseMode"]) {
            if (val === config.mouseMode) return;

            config.mouseMode = val;
            if (isListening) {
                setMouse(config.enableMouse, config.stdout, val);
            }
        },
        set enableKittyProtocol(val: Config["enableKittyProtocol"]) {
            if (val === config.enableKittyProtocol) return;

            config.enableKittyProtocol = val;
            if (isListening) {
                setKittyProtocol(val, config.stdout, config.stdin);
            }
        },

        // GETTERS
        get debounceMs() {
            return config.debounceMs;
        },
        get altScreen() {
            return config.altScreen;
        },
        get exitOnCtrlC() {
            return config.exitOnCtrlC;
        },
        get stdout() {
            return config.stdout;
        },
        get stdin() {
            return config.stdin;
        },
        get enableMouse() {
            return config.enableMouse;
        },
        get mouseMode() {
            return config.mouseMode;
        },
        get enableKittyProtocol() {
            return config.enableKittyProtocol;
        },
    };

    latestEndRuntime.latest = logic.endRuntime;

    return { logic, api, actionElements };
}
