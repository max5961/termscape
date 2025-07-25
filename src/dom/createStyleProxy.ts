import { root } from "./Root.js";

export function createStyleProxy<T extends object>(
    target: T,
    applyStyles: (p: keyof T, newValue: unknown) => void,
) {
    return new Proxy<T>(target, {
        set(target, p, newValue) {
            if (target[p as keyof T] !== newValue) {
                target[p as keyof T] = newValue;
                applyStyles(p as keyof T, newValue);
                root.scheduleRender();
            }
            return true;
        },
    });
}
