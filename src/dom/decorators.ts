import { type WriteOpts } from "../render/Renderer.js";
import { DomElement } from "./DomElement.js";

function createDecorator<T extends DomElement, U>(cb: {
    (this: T, ...injected: U[]): unknown;
}): (...injected: U[]) => MethodDecorator {
    return (...injected: U[]) =>
        (_target, _prop, descriptor: PropertyDescriptor) => {
            const original = descriptor.value;

            descriptor.value = function (this: T, ...args: unknown[]) {
                original?.apply(this, args);
                cb.apply(this, injected);
            };
        };
}

export const Render = createDecorator(function (this, opts: WriteOpts) {
    this.getRoot()?.scheduleRender(opts);
});
