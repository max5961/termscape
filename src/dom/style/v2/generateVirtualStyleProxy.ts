import type { YogaNode } from "../../../Types.js";
import type { ShadowStyleProxy } from "./ShadowStyleProxy.js";
import type { Style } from "../Style.js";
import { VirtualStyleProxy } from "./VirtualStyleProxy.js";

export function generateVirtualStyleProxy(defaults: Style.All) {
    class GeneratedVirtual extends VirtualStyleProxy {
        constructor(shadow: ShadowStyleProxy, node: YogaNode) {
            super(shadow, node, defaults);
        }
    }

    return GeneratedVirtual as unknown as new () => VirtualStyleProxy;
}
