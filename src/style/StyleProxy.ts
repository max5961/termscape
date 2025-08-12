import { type YogaNode } from "../types.js";
import { type VirtualStyle, type ShadowStyle } from "./Style.js";
import { AggregateHandlers, SanitizerHandlers, YogaHandlers } from "./StyleHandlers.js";
import type { DomElement } from "../dom/DomElement.js";

export function createVirtualStyleProxy<
    T extends VirtualStyle = VirtualStyle,
    U extends ShadowStyle = ShadowStyle,
>(node: YogaNode, rootRef: DomElement["rootRef"]) {
    const shadowStyle = createShadowStyleProxy<U>(node, rootRef);
    const virtualStyle = new Proxy<T>({} as T, {
        get(target: T, prop: keyof VirtualStyle) {
            return target[prop];
        },
        set(target: T, prop: keyof VirtualStyle, newValue: any) {
            if (target[prop] === newValue) {
                return true;
            }

            target[prop] = newValue;

            let sanitized = newValue;
            if (SanitizerHandlers[prop]) {
                sanitized = SanitizerHandlers[prop](
                    sanitized,
                    rootRef.root?.runtime.stdout ?? process.stdout,
                );
            }

            // PASS TO SHADOW PROXY
            shadowStyle[prop] = sanitized;

            return true;
        },
    });

    return { shadowStyle, virtualStyle };
}

function createShadowStyleProxy<T extends ShadowStyle>(
    node: YogaNode,
    rootRef: DomElement["rootRef"],
) {
    return new Proxy<T>({} as T, {
        get(target: T, prop: keyof ShadowStyle) {
            return target[prop];
        },
        set(target: T, prop: keyof ShadowStyle, newValue: any) {
            if (target[prop] !== newValue) {
                target[prop] = newValue;

                AggregateHandlers[prop]?.(newValue, target);
                YogaHandlers[prop]?.(newValue, node, target);

                // const shouldCalculateLayout = !!YogaHandlers[prop];

                rootRef.root?.scheduleRender();
            }
            return true;
        },
    });
}
