import type { Canvas } from "../../compositor/Canvas.js";

export type PerformanceData = {
    layoutMs: number;
    diffMs: number;
    diffStrategy: "refresh" | "precise";
};

export type Hook =
    | "pre-layout"
    | "post-layout"
    | "pre-write"
    | "post-write"
    | "block-render"
    | "performance";

export type HookContext<T extends Hook> = T extends "pre-layout" | "block-render"
    ? undefined
    : T extends "post-layout"
      ? Canvas
      : T extends "pre-write" | "post-write"
        ? { lastCanvas: Canvas | null; nextCanvas: Canvas }
        : T extends "performance"
          ? PerformanceData
          : undefined;

export type HookHandler<T extends Hook> = (
    content: HookContext<T>,
) => T extends "block-render" ? boolean : unknown;

export class HooksManager {
    private hooks: Map<Hook, Set<HookHandler<Hook>>>;

    constructor() {
        this.hooks = new Map();
    }

    public addHook<T extends Hook>(hook: T, cb: HookHandler<T>) {
        const set = this.getHookSet(hook);
        set.add(cb);
        return () => this.removeHook(hook, cb);
    }

    public removeHook<T extends Hook>(hook: T, cb: HookHandler<T>) {
        const set = this.getHookSet(hook);
        set.delete(cb);

        if (!set.size) {
            this.hooks.delete(hook);
        }
    }

    public exec<T extends Hook>(hook: Hook, context: HookContext<T>) {
        const set = this.getHookSet(hook);
        set.forEach((handler) => handler(context));
    }

    public getHookSet<T extends Hook>(hook: T): Set<HookHandler<T>> {
        if (!this.hooks.has(hook)) {
            this.hooks.set(hook, new Set());
        }
        return this.hooks.get(hook)!;
    }
}
