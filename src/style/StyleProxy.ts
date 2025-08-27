import type { YogaNode, VirtualStyle, ViewportStyle, ShadowStyle } from "../Types.js";
import { AggregateHandlers, SanitizerHandlers, YogaHandlers } from "./StyleHandlers.js";
import type { DomElement } from "../dom/DomElement.js";
import { checkIfViewportDimensions } from "./util/checkIfViewportDimensions.js";
import { shouldAlwaysRecalc } from "./util/recalculateStyle.js";

export function createVirtualStyleProxy<
    T extends VirtualStyle = VirtualStyle,
    U extends ShadowStyle = ShadowStyle,
>(elem: DomElement, rootRef: DomElement["rootRef"], metadata: DomElement["metadata"]) {
    const virtualStyle = new Proxy<T>({} as T, {
        get(target: T, prop: keyof VirtualStyle) {
            return target[prop];
        },
        set(target: T, prop: keyof VirtualStyle, newValue: any) {
            const viewportProp = checkIfViewportDimensions(prop, newValue);
            const alwaysRecalc = shouldAlwaysRecalc(prop);

            if (target[prop] === newValue && !alwaysRecalc) {
                return true;
            }

            if (viewportProp) {
                // Lazy - once a node has a dynamic dimension it stays in the Set for its lifecycle
                metadata.setViewportStyles(prop as ViewportStyle, true);
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

                const layoutChange =
                    !!YogaHandlers[prop] ||
                    prop === "overflow" ||
                    prop === "overflowX" ||
                    prop === "overflowY";

                const writeOpts = layoutChange ? { layoutChange } : undefined;
                rootRef.root?.scheduleRender(writeOpts);
            }
            return true;
        },
    });

    return shadowStyle;
}
