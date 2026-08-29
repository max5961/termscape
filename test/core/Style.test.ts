import { describe, test, expect, beforeEach } from "vitest";
import { CoreElement } from "../../src/core/CoreElement.js";

describe.only("VirtualStyle & ShadowStyle", () => {
    let core: CoreElement;
    beforeEach(() => {
        core = new CoreElement({});
    });

    describe("Wide & Narrow", () => {
        test("W1", () => {
            core.virtual.margin = 1;
            expect(core.virtual.margin).toBe(1);

            expect(core.virtual.marginTop).toBe(undefined);
            expect(core.virtual.marginBottom).toBe(undefined);
            expect(core.virtual.marginLeft).toBe(undefined);
            expect(core.virtual.marginRight).toBe(undefined);

            expect(core.shadow.marginTop).toBe(1);
            expect(core.shadow.marginBottom).toBe(1);
            expect(core.shadow.marginLeft).toBe(1);
            expect(core.shadow.marginRight).toBe(1);
        });

        test("W1 -> Wx", () => {
            core.virtual.margin = 1;
            core.virtual.margin = undefined;

            expect(core.virtual.margin).toBe(undefined);

            expect(core.shadow.marginTop).toBe(undefined);
            expect(core.shadow.marginBottom).toBe(undefined);
            expect(core.shadow.marginLeft).toBe(undefined);
            expect(core.shadow.marginRight).toBe(undefined);

            expect(core.virtual.marginTop).toBe(undefined);
            expect(core.virtual.marginBottom).toBe(undefined);
            expect(core.virtual.marginLeft).toBe(undefined);
            expect(core.virtual.marginRight).toBe(undefined);
        });

        test("N5", () => {
            core.virtual.marginTop = 5;
            expect(core.virtual.marginTop).toBe(5);
            expect(core.shadow.marginTop).toBe(5);
        });

        test("N5 -> Nx", () => {
            core.virtual.marginTop = 5;
            core.virtual.marginTop = undefined;
            expect(core.virtual.marginTop).toBe(undefined);
            expect(core.shadow.marginTop).toBe(undefined);
        });

        test("W1 -> N5", () => {
            core.virtual.margin = 1;
            core.virtual.marginTop = 5;

            expect(core.virtual.margin).toBe(1);

            expect(core.shadow.marginTop).toBe(5);
            expect(core.virtual.marginTop).toBe(5);

            expect(core.shadow.marginBottom).toBe(1);
            expect(core.shadow.marginLeft).toBe(1);
            expect(core.shadow.marginRight).toBe(1);

            expect(core.virtual.marginBottom).toBe(undefined);
            expect(core.virtual.marginLeft).toBe(undefined);
            expect(core.virtual.marginRight).toBe(undefined);
        });

        test("N5 -> W1", () => {
            core.virtual.marginTop = 5;
            core.virtual.margin = 1;

            expect(core.virtual.marginTop).toBe(5);
            expect(core.shadow.marginTop).toBe(5);

            expect(core.virtual.margin).toBe(1);

            expect(core.virtual.marginBottom).toBe(undefined);
            expect(core.virtual.marginLeft).toBe(undefined);
            expect(core.virtual.marginRight).toBe(undefined);

            expect(core.shadow.marginBottom).toBe(1);
            expect(core.shadow.marginLeft).toBe(1);
            expect(core.shadow.marginRight).toBe(1);
        });

        test("W1 -> N5 -> W2", () => {
            core.virtual.margin = 1;
            core.virtual.marginTop = 5;
            core.virtual.margin = 2;

            expect(core.virtual.marginTop).toBe(5);
            expect(core.shadow.marginTop).toBe(5);
            expect(core.virtual.margin).toBe(2);
            expect(core.shadow.marginBottom).toBe(2);
            expect(core.shadow.marginLeft).toBe(2);
            expect(core.shadow.marginRight).toBe(2);
        });

        test("W1 -> N5 -> Wx", () => {
            core.virtual.margin = 1;
            core.virtual.marginTop = 5;
            core.virtual.margin = undefined;

            expect(core.virtual.margin).toBe(undefined);

            expect(core.virtual.marginTop).toBe(5);
            expect(core.shadow.marginTop).toBe(5);

            expect(core.virtual.marginBottom).toBe(undefined);
            expect(core.shadow.marginBottom).toBe(undefined);
            expect(core.virtual.marginLeft).toBe(undefined);
            expect(core.shadow.marginLeft).toBe(undefined);
            expect(core.virtual.marginRight).toBe(undefined);
            expect(core.shadow.marginRight).toBe(undefined);
        });

        test("W1 -> N5 -> Wx -> Nx", () => {
            core.virtual.margin = 1;
            core.virtual.marginTop = 5;
            core.virtual.margin = undefined;
            core.virtual.marginTop = undefined;

            expect(core.virtual.margin).toBe(undefined);
            expect(core.virtual.marginTop).toBe(undefined);
            expect(core.shadow.marginTop).toBe(undefined);
        });

        // *** Important test ***
        test("N5 - W1 - Nx", () => {
            core.virtual.marginTop = 5;
            core.virtual.margin = 1;
            core.virtual.marginTop = undefined;

            expect(core.virtual.margin).toBe(1);

            expect(core.virtual.marginTop).toBe(undefined);
            expect(core.shadow.marginTop).toBe(1);
            expect(core.virtual.marginBottom).toBe(undefined);
            expect(core.shadow.marginBottom).toBe(1);
            expect(core.virtual.marginRight).toBe(undefined);
            expect(core.shadow.marginRight).toBe(1);
            expect(core.virtual.marginLeft).toBe(undefined);
            expect(core.shadow.marginLeft).toBe(1);
        });

        test("W1 -> N5 -> Nx", () => {
            core.virtual.margin = 1;
            core.virtual.marginTop = 5;
            core.virtual.marginTop = undefined;

            expect(core.virtual.margin).toBe(1);

            expect(core.virtual.marginTop).toBe(undefined);
            expect(core.shadow.marginTop).toBe(1);
            expect(core.virtual.marginBottom).toBe(undefined);
            expect(core.shadow.marginBottom).toBe(1);
            expect(core.virtual.marginLeft).toBe(undefined);
            expect(core.shadow.marginLeft).toBe(1);
            expect(core.virtual.marginRight).toBe(undefined);
            expect(core.shadow.marginRight).toBe(1);
        });

        test("W1 - N5 - Nx - W1 (same value W both times)", () => {
            core.virtual.margin = 1;
            core.virtual.marginTop = 5;
            core.virtual.marginTop = undefined;
            core.virtual.margin = 1;

            expect(core.virtual.margin).toBe(1);
            expect(core.virtual.marginTop).toBe(undefined);
            expect(core.shadow.marginTop).toBe(1);
            expect(core.virtual.marginBottom).toBe(undefined);
            expect(core.shadow.marginBottom).toBe(1);
            expect(core.virtual.marginLeft).toBe(undefined);
            expect(core.shadow.marginLeft).toBe(1);
            expect(core.virtual.marginRight).toBe(undefined);
            expect(core.shadow.marginRight).toBe(1);
        });
    });

    describe("Middle & Narrow", () => {
        test("M1", () => {
            core.virtual.marginY = 1;
            expect(core.virtual.marginY).toBe(1);

            expect(core.virtual.marginTop).toBe(undefined);
            expect(core.virtual.marginBottom).toBe(undefined);

            expect(core.shadow.marginTop).toBe(1);
            expect(core.shadow.marginBottom).toBe(1);
        });

        test("M1 -> Mx", () => {
            core.virtual.marginY = 1;
            core.virtual.marginY = undefined;

            expect(core.virtual.marginY).toBe(undefined);

            expect(core.shadow.marginTop).toBe(undefined);
            expect(core.shadow.marginBottom).toBe(undefined);

            expect(core.virtual.marginTop).toBe(undefined);
            expect(core.virtual.marginBottom).toBe(undefined);
        });

        test("M1 -> N5", () => {
            core.virtual.marginY = 1;
            core.virtual.marginTop = 5;

            expect(core.virtual.marginY).toBe(1);

            expect(core.shadow.marginTop).toBe(5);
            expect(core.virtual.marginTop).toBe(5);

            expect(core.shadow.marginBottom).toBe(1);
            expect(core.virtual.marginBottom).toBe(undefined);
        });

        test("N5 -> M1", () => {
            core.virtual.marginTop = 5;
            core.virtual.marginY = 1;

            expect(core.virtual.marginY).toBe(1);

            expect(core.virtual.marginTop).toBe(5);
            expect(core.shadow.marginTop).toBe(5);

            expect(core.virtual.marginBottom).toBe(undefined);
            expect(core.shadow.marginBottom).toBe(1);
        });

        test("M1 -> N5 -> M2", () => {
            core.virtual.marginY = 1;
            core.virtual.marginTop = 5;
            core.virtual.marginY = 2;

            expect(core.virtual.marginTop).toBe(5);
            expect(core.shadow.marginTop).toBe(5);
            expect(core.virtual.marginY).toBe(2);
            expect(core.shadow.marginBottom).toBe(2);
        });

        test("M1 -> N5 -> Mx", () => {
            core.virtual.marginY = 1;
            core.virtual.marginTop = 5;
            core.virtual.marginY = undefined;

            expect(core.virtual.marginY).toBe(undefined);

            expect(core.virtual.marginTop).toBe(5);
            expect(core.shadow.marginTop).toBe(5);

            expect(core.virtual.marginBottom).toBe(undefined);
            expect(core.shadow.marginBottom).toBe(undefined);
        });

        test("M1 -> N5 -> Mx -> Mx", () => {
            core.virtual.marginY = 1;
            core.virtual.marginTop = 5;
            core.virtual.marginY = undefined;
            core.virtual.marginTop = undefined;

            expect(core.virtual.marginY).toBe(undefined);
            expect(core.virtual.marginTop).toBe(undefined);
            expect(core.shadow.marginTop).toBe(undefined);
        });

        test("N5 - M1 - Nx", () => {
            core.virtual.marginTop = 5;
            core.virtual.marginY = 1;
            core.virtual.marginTop = undefined;

            expect(core.virtual.marginY).toBe(1);

            expect(core.virtual.marginTop).toBe(undefined);
            expect(core.shadow.marginTop).toBe(1);
            expect(core.virtual.marginBottom).toBe(undefined);
            expect(core.shadow.marginBottom).toBe(1);
        });

        test("W1 -> N5 -> Nx", () => {
            core.virtual.marginY = 1;
            core.virtual.marginTop = 5;
            core.virtual.marginTop = undefined;

            expect(core.virtual.marginY).toBe(1);

            expect(core.virtual.marginTop).toBe(undefined);
            expect(core.shadow.marginTop).toBe(1);
            expect(core.virtual.marginBottom).toBe(undefined);
            expect(core.shadow.marginBottom).toBe(1);
        });

        test("W1 - N5 - Nx - W1 (same value W both times)", () => {
            core.virtual.marginY = 1;
            core.virtual.marginTop = 5;
            core.virtual.marginTop = undefined;
            core.virtual.marginY = 1;

            expect(core.virtual.marginY).toBe(1);
            expect(core.virtual.marginTop).toBe(undefined);
            expect(core.shadow.marginTop).toBe(1);
            expect(core.virtual.marginBottom).toBe(undefined);
            expect(core.shadow.marginBottom).toBe(1);
        });
    });

    describe("default styles", () => {
        test("Wide { margin: 5 }", () => {
            const core = new CoreElement({
                margin: 5,
            });

            expect(core.virtual.margin).toBe(5);

            expect(core.virtual.marginTop).toBe(undefined);
            expect(core.virtual.marginBottom).toBe(undefined);
            expect(core.virtual.marginLeft).toBe(undefined);
            expect(core.virtual.marginRight).toBe(undefined);

            expect(core.shadow.marginTop).toBe(5);
            expect(core.shadow.marginBottom).toBe(5);
            expect(core.shadow.marginLeft).toBe(5);
            expect(core.shadow.marginRight).toBe(5);
        });

        test("Middle { marginY: 5 }", () => {
            const core = new CoreElement({
                marginY: 5,
            });

            expect(core.virtual.marginY).toBe(5);

            expect(core.virtual.marginTop).toBe(undefined);
            expect(core.virtual.marginBottom).toBe(undefined);

            expect(core.shadow.marginTop).toBe(5);
            expect(core.shadow.marginBottom).toBe(5);
        });

        test("Narrow { marginTop: 5 }", () => {
            const core = new CoreElement({ marginTop: 5 });
            expect(core.virtual.marginTop).toBe(5);
            expect(core.shadow.marginTop).toBe(5);
        });

        test("N5 - W1 - Nx w/ defaults", () => {
            const core = new CoreElement({ marginTop: 10 });

            core.virtual.marginTop = 5;
            core.virtual.margin = 1;
            core.virtual.marginTop = undefined;

            expect(core.virtual.margin).toBe(1);

            expect(core.virtual.marginTop).toBe(10);
            expect(core.shadow.marginTop).toBe(10);
            expect(core.virtual.marginBottom).toBe(undefined);
            expect(core.shadow.marginBottom).toBe(1);
            expect(core.virtual.marginRight).toBe(undefined);
            expect(core.shadow.marginRight).toBe(1);
            expect(core.virtual.marginLeft).toBe(undefined);
            expect(core.shadow.marginLeft).toBe(1);
        });
    });
});
