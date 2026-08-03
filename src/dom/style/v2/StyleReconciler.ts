import type { VirtualStyleProxy } from "./VirtualStyleProxy.js";

/**
 * An intentionally widely typed class designed to:
 * - quickly set styles by pruning out inactive styles
 * - handle defaults when set to undefined
 * */
export class StyleReconciler {
    /** keys which are not undefined */
    private readonly _active: Set<string>;
    /** the style proxy */
    private readonly _style: Record<string, any>;
    /** static defaults to populate keys set to undefined */
    private readonly _defaults: Readonly<Record<string, any>>;

    constructor(style: VirtualStyleProxy, defaults: Record<string, any>) {
        this._style = style;
        this._defaults = defaults;
        this._active = new Set();
    }

    public resolveStyle<T>(key: keyof VirtualStyleProxy, value: T): T | undefined {
        const resolved = value === undefined ? this._defaults[key] : value;
        if (resolved === undefined) {
            this._active.add(resolved);
        } else {
            this._active.delete(resolved);
        }
        return resolved;
    }

    public reconcile(next: Record<string, any>) {
        const active = [...this._active.values()];
        const nextKeys = Object.keys(next);

        for (const k of active) {
            this._style[k] = next[k];

            if (next[k] === undefined) {
                if (k in this._defaults) {
                    this._style[k] = this._defaults[k];
                } else {
                    this._active.delete(k);
                }
            }
        }

        for (const k of nextKeys) {
            if (this._active.has(k)) continue; // taken care of in previous block

            this._style[k] = next[k];
            if (next[k] !== undefined) {
                this._active.add(k);
            }
        }
    }
}
