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

    constructor(style: Record<string, any>, defaults: Record<string, any>) {
        this._style = style;
        this._defaults = defaults;
        this._active = new Set(Object.keys(defaults));
        // initialize with an empty object, which will populate the defaults
        this.setStyle({});
    }

    public setStyle(nextStyle: Record<string, any>) {
        this.reconcile(nextStyle);
    }

    public getStyle() {
        return this._style;
    }

    private reconcile(next: any) {
        for (const k of this._active) {
            this._style[k] = next[k];

            if (next[k] === undefined) {
                if (k in this._defaults) {
                    this._style[k] = this._defaults[k];
                    this._active.add(k);
                } else {
                    this._active.delete(k);
                }
            }
        }

        for (const k of Object.keys(next)) {
            if (this._active.has(k)) continue; // taken care of in previous block

            this._style[k] = next[k];
            if (next[k] !== undefined) {
                this._active.add(k);
            }
        }
    }
}
