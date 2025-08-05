import { FriendDomElement } from "./DomElement.js";

/**
 * Triggers the element's `Root` to schedule a render **if** the element is
 * attached to the root.
 * */
export function createStyleProxy<T extends object>(
    target: T,
    applyStyles: (p: keyof T, newValue: unknown) => void,
    element: FriendDomElement,
) {
    return new Proxy<T>(target, {
        set(target, p, newValue) {
            if (target[p as keyof T] !== newValue) {
                target[p as keyof T] = newValue;
                applyStyles(p as keyof T, newValue);
                if (element.isAttached) {
                    element.root?.scheduleRender({ resize: false });
                }
            }
            return true;
        },
    });
}
