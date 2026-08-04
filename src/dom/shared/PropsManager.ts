import type { DomElement } from "../DomElement.js";
import type { Props } from "../props/Props.js";

export type PropEffectHandler<T extends keyof Props.All> = (
    value: Props.All[T],
    prev: Props.All[T],
    update: (value: Props.All[T]) => void,
) => any;

type UntypedPropEffectHandler = PropEffectHandler<any>;

export class PropsManager {
    private host: DomElement;
    private props: Map<PropertyKey, any>;
    private effects: Map<PropertyKey, UntypedPropEffectHandler>;

    constructor(host: DomElement) {
        this.host = host;
        this.props = new Map();
        this.effects = new Map();
    }

    public setProp(key: PropertyKey, value: any) {
        const prev = this.props.get(key);

        const setProp = (value: any) => {
            this.props.set(key, value);
            if (value !== prev) {
                this.host._metadata.getRoot()?.scheduleRender();
            }
        };
        setProp(value);

        const effect = this.effects.get(key);
        effect?.(value, prev, setProp);
    }

    public getProp(key: PropertyKey) {
        return this.props.get(key);
    }

    public registerEffect(key: string, effect: UntypedPropEffectHandler) {
        this.effects.set(key, effect);
    }
}
