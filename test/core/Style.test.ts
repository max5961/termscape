import { describe, test, expect, beforeEach } from "vitest";
import { CoreElement } from "../../src/core/CoreElement.js";
import { DomElement } from "../../src/dom/DomElement.js";

describe("VirtualStyle & ShadowStyle", () => {
    const shell = undefined as unknown as DomElement;
    let core: CoreElement;
    beforeEach(() => {
        core = new CoreElement(shell, {});
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
            const core = new CoreElement(shell, {
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
            const core = new CoreElement(shell, {
                marginY: 5,
            });

            expect(core.virtual.marginY).toBe(5);

            expect(core.virtual.marginTop).toBe(undefined);
            expect(core.virtual.marginBottom).toBe(undefined);

            expect(core.shadow.marginTop).toBe(5);
            expect(core.shadow.marginBottom).toBe(5);
        });

        test("Narrow { marginTop: 5 }", () => {
            const core = new CoreElement(shell, { marginTop: 5 });
            expect(core.virtual.marginTop).toBe(5);
            expect(core.shadow.marginTop).toBe(5);
        });

        test("N5 - W1 - Nx w/ defaults", () => {
            const core = new CoreElement(shell, { marginTop: 10 });

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

    describe("style setter", () => {
        test("set without defaults", () => {
            const core = new CoreElement(shell, {});

            core.virtual.__setStyle({
                margin: 1,
                marginTop: 2,
            });

            expect(core.virtual.margin).toBe(1);
            expect(core.virtual.marginTop).toBe(2);
            expect(core.virtual.marginBottom).toBe(undefined);
            expect(core.virtual.marginRight).toBe(undefined);
            expect(core.virtual.marginLeft).toBe(undefined);

            expect(core.shadow.marginTop).toBe(2);
            expect(core.shadow.marginBottom).toBe(1);
            expect(core.shadow.marginRight).toBe(1);
            expect(core.shadow.marginLeft).toBe(1);
        });

        test("set with defaults", () => {
            const core = new CoreElement(shell, { marginTop: 5 });

            core.virtual.__setStyle({ margin: 1 });

            expect(core.virtual.__getValues()).toEqual({
                margin: 1,
                marginTop: 5,
            });

            expect(core.shadow.getValues()).toEqual({
                marginTop: 5,
                marginBottom: 1,
                marginLeft: 1,
                marginRight: 1,
            });
        });

        test("setting does not carry over from last set", () => {
            const core = new CoreElement(shell, {});

            core.virtual.__setStyle({
                marginTop: 5,
                marginBottom: 4,
            });

            core.virtual.__setStyle({
                paddingTop: 5,
                paddingBottom: 4,
            });

            expect(core.virtual.__getValues()).toEqual({
                paddingTop: 5,
                paddingBottom: 4,
            });

            expect(core.shadow.getValues()).toEqual({
                paddingTop: 5,
                paddingBottom: 4,
            });
        });
    });
});
