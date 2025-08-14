import { type YogaNode } from "../types.js";
import { type VirtualStyle, type ShadowStyle, type DynamicStyle } from "./Style.js";
import { AggregateHandlers, SanitizerHandlers, YogaHandlers } from "./StyleHandlers.js";
import type { DomElement } from "../dom/DomElement.js";

const DYNAMIC_STYLES = new Set<DynamicStyle>([
    "height",
    "width",
    "minWidth",
    "minHeight",
]);

export function createVirtualStyleProxy<
    T extends VirtualStyle = VirtualStyle,
    U extends ShadowStyle = ShadowStyle,
>(node: YogaNode, rootRef: DomElement["rootRef"], metadata: DomElement["metadata"]) {
    const shadowStyle = createShadowStyleProxy<U>(node, rootRef);
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
                metadata.dynamicStyles.add(prop as DynamicStyle);
                metadata.notifyRoot();
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

                // CONSIDERATIONS - this should also include any dimension prop
                // const shouldCalculateLayout = !!YogaHandlers[prop];

                rootRef.root?.scheduleRender();
            }
            return true;
        },
    });
}

function checkIfDynamicDimensions(prop: string, value: string) {
    return (
        DYNAMIC_STYLES.has(prop as DynamicStyle) &&
        (value?.endsWith("vh") || value?.endsWith("vw"))
    );
}
