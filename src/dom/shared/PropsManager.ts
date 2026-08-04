import type { DomElement } from "../DomElement.js";

type Effect = (
    value: unknown,
    prev: unknown,
    update: (value: unknown) => void,
) => unknown;

export class PropsManager {
    private host: DomElement;
    private props: Map<string, unknown>;
    private effects: Map<string, Effect>;

    constructor(host: DomElement) {
        this.host = host;
        this.props = new Map();
        this.effects = new Map();
    }

    public setProp(key: string, value: unknown) {
        const prev = this.props.get(key);

        const setProp = (value: unknown) => {
            this.props.set(key, value);
            if (value !== prev) {
                this.host._metadata.getRoot()?.scheduleRender();
            }
        };
        setProp(value);

        const effect = this.effects.get(key);
        effect?.(value, prev, setProp);
    }

    public createEffect(key: string, effect: Effect) {
        this.effects.set(key, effect);
    }
}
