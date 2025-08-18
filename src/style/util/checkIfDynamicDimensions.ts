import type { DynamicStyle } from "../../Types.js";

const DYNAMIC_STYLES = new Set<DynamicStyle>([
    "height",
    "width",
    "minWidth",
    "minHeight",
]);

export function checkIfDynamicDimensions(prop: string, value: unknown) {
    if (typeof value !== "string") {
        return false;
    }

    return (
        DYNAMIC_STYLES.has(prop as DynamicStyle) &&
        (value.endsWith("vh") || value.endsWith("vw"))
    );
}
