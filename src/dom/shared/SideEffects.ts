/**
 * Mutating the reference will not actually set the prop.  setProp must be used
 * once if any prop changes are made during the effect
 * */
export type PropEffectHandler<Value> = (
    value: Value,
    // not sure why typescript forces an unknown here.
    setProp: (value: unknown) => void,
) => unknown;

type Effect = (value: unknown, setProp: unknown) => unknown;

export class SideEffects {
    private hasConstructed: boolean;
    private map: Record<PropertyKey, Effect>;

    constructor() {
        this.map = {};
        this.hasConstructed = false;
        process.nextTick(() => (this.hasConstructed = true));
    }

    public registerEffect(prop: PropertyKey, cb: Effect) {
        this.map[prop] = cb;
        return () => {
            if (this.map[prop] === cb) {
                this.map[prop] = () => {};
            }
        };
    }

    public dispatchEffect(
        prop: string,
        value: unknown,
        setProp: (value: unknown) => unknown,
    ) {
        if (this.hasConstructed) {
            this.map[prop]?.(value, setProp);
        } else {
            queueMicrotask(() => {
                this.map[prop]?.(value, setProp);
            });
        }
    }
}
