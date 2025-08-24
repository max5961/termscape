import { DomElement } from "../DomElement.js";
import type { WriteOpts } from "../../Types.js";

function createDecorator<T extends DomElement, U>(cb: {
    (this: T, ...injected: U[]): unknown;
}): (...injected: U[]) => MethodDecorator {
    return (...injected: U[]) =>
        (_target, _prop, descriptor: PropertyDescriptor) => {
            const original = descriptor.value;

            descriptor.value = function (this: T, ...args: unknown[]) {
                const result = original?.apply(this, args);
                cb.apply(this, injected);
                return result;
            };
        };
}

export const Render = createDecorator(function (this, opts: WriteOpts) {
    this.getRoot()?.scheduleRender(opts);
});

export const OnChildrenUpdate = createDecorator(function (this) {
    this.onChildrenUpdate();
});

export const RequestInput = createDecorator(function (this) {
    this.requiresStdin = true;
    this.getRoot()?.requestInputStream();
});
