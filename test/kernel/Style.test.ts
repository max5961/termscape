import { describe, test, expect } from "vitest";
import { Kernel } from "../../src/kernel/Kernel.js";

describe("VirtualStyle & ShadowStyle", () => {
    describe("margin", () => {
        test("margin sets narrow shadow and virtual, and wide virtual", () => {
            const kernel = new Kernel();
            kernel.virtual.margin = 2;
            expect(kernel.virtual.margin).toBe(2);
            expect(kernel.shadow.marginTop).toBe(2);
            expect(kernel.shadow.marginBottom).toBe(2);
            expect(kernel.shadow.marginLeft).toBe(2);
            expect(kernel.shadow.marginRight).toBe(2);
        });

        test("Narrow styles will prevent wider styles from overriding them", () => {
            const kernel = new Kernel();
            kernel.virtual.marginTop = 3;
            kernel.virtual.margin = 1;
            expect(kernel.shadow.marginTop).toBe(3);
        });

        test("Undefining a narrow style will fallback to the wider if set", () => {
            const kernel = new Kernel();
            kernel.virtual.marginTop = 3;
            kernel.virtual.margin = 1;
            kernel.virtual.marginTop = undefined;
            expect(kernel.shadow.marginTop).toBe(1);
        });
    });
});
