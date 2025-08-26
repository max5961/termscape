import type { ViewportStyle } from "../../Types.js";

const VPStyles = new Set<ViewportStyle>(["height", "width", "minWidth", "minHeight"]);

export function checkIfViewportDimensions(prop: string, value: unknown) {
    if (typeof value !== "string") {
        return false;
    }

    return (
        VPStyles.has(prop as ViewportStyle) &&
        (value.endsWith("vh") || value.endsWith("vw"))
    );
}
