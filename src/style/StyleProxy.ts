import type { YogaNode, VirtualStyle, DynamicStyle, ShadowStyle } from "../Types.js";
import { AggregateHandlers, SanitizerHandlers, YogaHandlers } from "./StyleHandlers.js";
import type { DomElement } from "../dom/DomElement.js";
import { checkIfDynamicDimensions } from "./util/checkIfDynamicDimensions.js";

export function createVirtualStyleProxy<
    T extends VirtualStyle = VirtualStyle,
    U extends ShadowStyle = ShadowStyle,
>(elem: DomElement, rootRef: DomElement["rootRef"], metadata: DomElement["metadata"]) {
    const virtualStyle = new Proxy<T>({} as T, {
        get(target: T, prop: keyof VirtualStyle) {
            return target[prop];
        },
        set(target: T, prop: keyof VirtualStyle, newValue: any) {
            const dynamicProp = checkIfDynamicDimensions(prop, newValue);

            // If the prop is dynamic, we don't want to skip setting it even if unchanged
            if (target[prop] === newValue && !dynamicProp) {
                return true;
            }

            if (dynamicProp) {
                // Lazy - once a node has a dynamic dimension it stays in the
                // Set for its lifecycle
                metadata.setDynamicStyles(prop as DynamicStyle, true);
            }

            target[prop] = newValue;

            let sanitized = newValue;
            if (SanitizerHandlers[prop]) {
                sanitized = SanitizerHandlers[prop](
                    sanitized,
                    rootRef.root?.runtime.stdout ?? process.stdout,
                    elem,
                );
            }

            // PASS TO SHADOW PROXY
            shadowStyle[prop] = sanitized;

            return true;
        },
    });
    const shadowStyle = createShadowStyleProxy<U>(elem.node, rootRef, virtualStyle);

    return { shadowStyle, virtualStyle };
}

function createShadowStyleProxy<T extends ShadowStyle>(
    node: YogaNode,
    rootRef: DomElement["rootRef"],
    virtualStyle: VirtualStyle,
) {
    const shadowStyle = new Proxy<T>({} as T, {
        get(target: T, prop: keyof ShadowStyle) {
            return target[prop];
        },
        set(target: T, prop: keyof ShadowStyle, newValue: any) {
            if (target[prop] !== newValue) {
                target[prop] = newValue;

                AggregateHandlers[prop]?.(newValue, shadowStyle, virtualStyle);
                YogaHandlers[prop]?.(newValue, node, shadowStyle, virtualStyle);

                // const shouldCalculateLayout = !!YogaHandlers[prop];

                rootRef.root?.scheduleRender();
            }
            return true;
        },
    });

    return shadowStyle;
}
