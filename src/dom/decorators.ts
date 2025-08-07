import { DomElement } from "./DomElement.js";

export function Render(): MethodDecorator {
    return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
        const original = descriptor.value;

        descriptor.value = function (this: DomElement, ...args: unknown[]) {
            original(...args);
            this.getRealRoot()?.render();
        };

        return descriptor;
    };
}
