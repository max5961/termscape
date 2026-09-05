import { objectKeys } from "../../util.js";

export type RuntimeOperations<T> = {
    [P in keyof T]: {
        set: (v: T[P]) => unknown;
        disable: (v: T[P]) => unknown;
        initialize: (v: T[P]) => unknown;
    };
};

export abstract class RuntimeEffect<T extends object> {
    private active: boolean;
    private state: T;
    private waiting: Map<keyof T, () => unknown>;
    private hasInitializedSetup: boolean;
    protected abstract operations: RuntimeOperations<T>;
    protected abstract setupState: T;

    constructor() {
        this.active = false;
        this.state = {} as T;
        this.hasInitializedSetup = false;
        this.waiting = new Map();
    }

    public start() {
        if (this.active) return;
        this.active = true;

        if (!this.hasInitializedSetup) {
            this.initializeSetupState();
        }

        this.waiting.forEach((cb) => cb());
        this.waiting.clear();
    }

    public end() {
        if (!this.active) return;
        this.active = false;

        for (const prop of objectKeys(this.state)) {
            this.operations[prop].disable(this.state[prop]);
            this.initialize(prop, this.state[prop], { shouldDefer: true });
        }
    }

    public set = <P extends keyof T>(
        prop: P,
        value: T[P],
        opts?: { shouldDefer: boolean },
    ) => {
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

    protected initialize = <P extends keyof T>(
        prop: P,
        value: T[P],
        opts: { shouldDefer: boolean },
    ) => {
        const wrapper = () => {
            this.state[prop] = value;
            this.operations[prop].initialize(value);
        };

        if (opts.shouldDefer) {
            return this.waiting.set(prop, wrapper);
        }
        wrapper();
    };

    public get = <P extends keyof T>(prop: P) => {
        return this.state[prop];
    };

    private initializeSetupState() {
        for (const prop of objectKeys(this.setupState)) {
            this.initialize(prop, this.setupState[prop], { shouldDefer: false });
        }
        this.hasInitializedSetup = true;
    }
}
