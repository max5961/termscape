import { objectKeys } from "../../util.js";
import type { RuntimeSetup } from "./Runtime.js";

export type RuntimeOperations<T> = {
    [P in keyof T]: {
        set: (v: T[P]) => unknown;
        disable: () => unknown;
    };
};

export abstract class RuntimeEffect<T extends RuntimeSetup> {
    private active: boolean;
    private state: T;
    private waiting: Map<keyof T, () => unknown>;
    private hasInitializedState: boolean;
    protected abstract operations: RuntimeOperations<T>;
    protected abstract initialState: T;

    constructor() {
        this.active = false;
        this.state = {} as T;
        this.hasInitializedState = false;
        this.waiting = new Map();
    }

    public start() {
        if (this.active) return;
        this.active = true;

        if (!this.hasInitializedState) {
            this.initializeState();
        }

        this.waiting.forEach((cb) => cb());
        this.waiting.clear();
    }

    public end() {
        if (!this.active) return;
        this.active = false;

        for (const prop of objectKeys(this.state)) {
            this.operations[prop].disable();
            this.set(prop, this.state[prop], { shouldDefer: true });
        }
    }

    public set = <P extends keyof T>(
        prop: P,
        value: T[P],
        opts?: { shouldDefer: boolean },
    ) => {
        // if the set operation is deferred, then probing into the state could
        // return an invalid operation.  Instead, the state should be set immediately
        // and then the wrapper should decide whether to return early based off
        // of that.  This way you could call set multiple times before active

        const wrapper = (value: T[P]) => {
            if (this.state[prop] === value) {
                if (!opts) return;
                if (opts && !opts.shouldDefer) return;
            }

            this.state[prop] = value;
            this.operations[prop].set(value);
        };

        const deferWrapper = () => {
            this.waiting.set(prop, () => wrapper(value));
        };

        if (opts && !opts.shouldDefer) {
            return wrapper(value);
        }
        if (opts && opts.shouldDefer) {
            return deferWrapper();
        }
        if (this.active) {
            return wrapper(value);
        }
        return deferWrapper();
    };

    public get = <P extends keyof T>(prop: P) => {
        return this.state[prop];
    };

    private initializeState() {
        for (const prop of objectKeys(this.initialState)) {
            this.set(prop, this.initialState[prop]);
        }
        this.hasInitializedState = true;
    }
}

interface IStdinEffect {
    mouse: boolean;
    mouseMode: 0 | 3;
    kittyKeyboard: boolean;
}

export class StdinEffect extends RuntimeEffect<IStdinEffect> {
    constructor() {
        super();
    }

    protected override initialState: IStdinEffect = {
        mouse: true,
        mouseMode: 3,
        kittyKeyboard: true,
    };

    protected override operations: RuntimeOperations<IStdinEffect> = {
        mouse: {
            set: () => {
                //
            },
            disable: () => {
                //
            },
        },
        mouseMode: {
            set: () => {
                //
            },
            disable: () => {
                //
            },
        },
        kittyKeyboard: {
            set: () => {
                //
            },
            disable: () => {
                //
            },
        },
    };
}
