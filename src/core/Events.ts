/* eslint-disable @typescript-eslint/no-unsafe-function-type */

type CallbackMap<K extends keyof T, T extends Record<string, any>> = (
    ...args: T[K]
) => unknown;

export class Events<T extends Record<string, any[]>> {
    private singles = new Map<PropertyKey, Function>();
    private multis = new Map<PropertyKey, Set<Function>>();

    public setSingle<K extends keyof T>(event: K, cb: CallbackMap<K, T>) {
        this.singles.set(event, cb);
    }

    public getSingle<K extends keyof T>(event: K) {
        return this.singles.get(event) as CallbackMap<K, T> | undefined;
    }

    public addMulti<K extends keyof T>(event: K, cb: CallbackMap<K, T>) {
        if (!this.multis.has(event)) {
            this.multis.set(event, new Set());
        }
        this.multis.get(event)!.add(cb);
    }

    public deleteMulti<K extends keyof T>(event: K, cb: CallbackMap<K, T>) {
        this.multis.get(event)?.delete(cb);

        if (this.multis.get(event)?.size === 0) {
            this.multis.delete(event);
        }
    }

    public getMultis<K extends keyof T>(event: K) {
        const multis = this.multis.get(event);
        return (multis ? [...multis] : []) as CallbackMap<K, T>[];
    }

    public dispatch<K extends keyof T>(event: K, ...args: T[K]) {
        const singles = this.singles.get(event);
        const multis = this.multis.get(event);

        singles?.(...args);
        multis?.forEach((cb) => cb(...args));
    }
}

const e = new Events<{
    foo: ["f", "o"];
    bar: ["b", "a"];
}>();

e.setSingle("foo", (a, b) => {});
e.dispatch("foo", "f", "o");
