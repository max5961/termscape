import type { YogaNode, ViewportStyle } from "../Types.js";
import { AggregateHandlers, SanitizerHandlers, YogaHandlers } from "./StyleHandlers.js";
import type { DomElement } from "../dom/DomElement.js";
import { checkIfViewportDimensions } from "./util/checkIfViewportDimensions.js";
import { shouldAlwaysRecalc } from "./util/recalculateStyle.js";
import type { BaseShadowStyle, BaseStyle } from "./Style.js";

export function createVirtualStyleProxy<T extends BaseStyle = BaseStyle>(
    elem: DomElement,
    rootRef: DomElement["rootRef"],
    metadata: DomElement["metadata"],
) {
    const virtualStyle = new Proxy<T>({} as T, {
        get(target: T, prop: keyof BaseStyle) {
            return target[prop];
        },
        set(target: T, prop: keyof BaseStyle, newValue: any) {
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
    const shadowStyle = createShadowStyleProxy(elem.node, rootRef, virtualStyle);

    return { shadowStyle, virtualStyle };
}

function createShadowStyleProxy<T extends BaseShadowStyle = BaseShadowStyle>(
    node: YogaNode,
    rootRef: DomElement["rootRef"],
    virtualStyle: BaseStyle,
) {
    const shadowStyle = new Proxy<T>({} as T, {
        get(target: T, prop: keyof BaseShadowStyle) {
            return target[prop];
        },
        set(target: T, prop: keyof BaseShadowStyle, newValue: any) {
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
