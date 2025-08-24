import type { DomElement } from "../Types.js";

export class DomElementCollection<T extends DomElement> {
    private _arr: T[];
    private watcher: (() => unknown) | undefined;

    constructor(watcher?: () => unknown) {
        this._arr = [];
        this.watcher = watcher;
    }

    get arr(): Readonly<T[]> {
        return this._arr;
    }

    public push(item: T) {
        this._arr.push(item);
        this.watcher?.();
    }

    public splice(start: number, deleteCount?: number) {
        this._arr.splice(start, deleteCount);
        this.watcher?.();
    }
}
