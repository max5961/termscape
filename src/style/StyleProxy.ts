import { YogaNode } from "../types.js";
import { AggregateHandlers, SanitizerHandlers, YogaHandlers } from "./ApplyRealStyles.js";
import { VStyle, RStyle } from "./Style.js";

export function createVirtualStyleProxy<
    T extends VStyle = VStyle,
    U extends RStyle = RStyle,
>(
    target: T,
    node: YogaNode,
    inheritSet: Set<keyof VStyle>,
    stdout: NodeJS.WriteStream,
    updater: () => void,
) {
    inheritSet.clear();

    const realStyle = createShadowStyleProxy<U>(updater, node);
    const virtualStyle = new Proxy<T>(target, {
        get(target: T, prop: keyof VStyle) {
            return target[prop];
        },
        set(target: T, prop: keyof VStyle, newValue: any) {
            if (target[prop] === newValue) {
                return true;
            }

            target[prop] = newValue;

            // STRIP INHERIT
            const inherit = newValue === "inherit";
            if (inherit) {
                inheritSet.add(prop);
            } else {
                inheritSet.delete(prop);
            }

            // SANITIZE
            let sanitized = inherit ? undefined : newValue;
            if (SanitizerHandlers[prop]) {
                sanitized = SanitizerHandlers[prop](sanitized, stdout);
            }

            // PASS TO SHADOW PROXY
            realStyle[prop] = sanitized;

            return true;
        },
    });

    return { realStyle, virtualStyle };
}

function createShadowStyleProxy<T extends RStyle>(updater: () => void, node: YogaNode) {
    return new Proxy<T>({} as T, {
        get(target: T, prop: keyof RStyle) {
            return target[prop];
        },
        set(target: T, prop: keyof RStyle, newValue: any) {
            if (target[prop] !== newValue) {
                target[prop] = newValue;

                AggregateHandlers[prop]?.(newValue, target);
                YogaHandlers[prop]?.(newValue, node, target);

                updater();
            }
            return true;
        },
    });
}
