import type { YogaNode, ViewportStyle } from "../../Types.js";
import { AggregateHandlers, SanitizerHandlers, YogaHandlers } from "./StyleHandlers.js";
import type { DomElement } from "../DomElement.js";
import { checkIfViewportDimensions } from "../util/checkIfViewportDimensions.js";
import { shouldAlwaysRecalc } from "../util/recalculateStyle.js";
import type { Style, Shadow } from "./Style.js";

export function createVirtualStyleProxy<T extends Style.All = Style.All>(
    elem: DomElement,
    rootRef: DomElement["_rootRef"],
    metadata: DomElement["_metadata"],
) {
    const virtualStyle = new Proxy<T>({} as T, {
        get(target: T, prop: keyof Style.All) {
            return target[prop];
        },
        set(target: T, prop: keyof Style.All, newValue: any) {
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
    const shadowStyle = createShadowStyleProxy(elem._node, rootRef, virtualStyle);

    return { shadowStyle, virtualStyle };
}

function createShadowStyleProxy<T extends Shadow<Style.All> = Shadow<Style.All>>(
    node: YogaNode,
    rootRef: DomElement["_rootRef"],
    virtualStyle: Style.All,
) {
    const shadowStyle = new Proxy<T>({} as T, {
        get(target: T, prop: keyof Shadow<Style.All>) {
            return target[prop];
        },
        set(target: T, prop: keyof Shadow<Style.All>, newValue: any) {
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
