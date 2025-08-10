import { WriteOpts } from "../render/Renderer.js";
import { DomElement } from "./DomElement.js";

export function Render(): MethodDecorator {
    return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
        const original = descriptor.value;

        descriptor.value = function (this: DomElement, ...args: unknown[]) {
            original.apply(this, ...args);
            this.getRealRoot()?.render();
        };

        return descriptor;
    };
}

export function UpdateInheritStyles(): MethodDecorator {
    return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
        const original = descriptor.value;

        descriptor.value = function (this: DomElement, ...args: unknown[]) {
            original.apply(this, ...args);
            this.applyInheritedStyles();
        };

        return descriptor;
    };
}

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

// Need to update tsconfig
export const _Render = createDecorator(function (this, opts: WriteOpts) {
    // this.getRealRoot()?.scheduleRender(opts);
});

export const _UpdateInheritStyles = createDecorator(function (
    this,
    kwarg: { detaching: boolean },
) {
    // this.applyInheritedStyles(kwarg.detaching);
});
