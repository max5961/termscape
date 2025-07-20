export function createStyleProxy<T extends object>(
    target: T,
    applyStyleToYoga: (p: keyof T, newValue: unknown) => void,
    scheduleRender: () => void,
) {
    return new Proxy<T>(target, {
        set(target, p, newValue) {
            if (target[p as keyof T] !== newValue) {
                target[p as keyof T] = newValue;
                applyStyleToYoga(p as keyof T, newValue);
                scheduleRender();
            }
            return true;
        },
    });
}
