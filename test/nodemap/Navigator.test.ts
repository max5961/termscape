import { describe, test, expect } from "vitest";
import { Navigator } from "@src/nodemap/Navigator.js";

describe("nodemap Navigator - basic movements", () => {
    const nodemap = new Navigator([
        ["foo", "bar"],
        ["baz", "ban"],
    ]);
    const control = nodemap.getControl(() => {});

    test("start focus position", () => {
        expect(control.getNode()).toBe("foo");
        expect(control.getIndex()).toBe(0);
    });

    test("up down left right", () => {
        expect(control.right()).toBe("bar");
        expect(control.down()).toBe("ban");
        expect(control.left()).toBe("baz");
        expect(control.up()).toBe("foo");
    });

    test("Behaves as expected when trying to go out of bounds", () => {
        expect(control.up()).toBe("foo");
        expect(control.left()).toBe("foo");
        expect(control.right()).toBe("bar");
        expect(control.right()).toBe("bar");
        expect(control.up()).toBe("bar");
        expect(control.down()).toBe("ban");
        expect(control.down()).toBe("ban");
        expect(control.right()).toBe("ban");
        expect(control.left()).toBe("baz");
        expect(control.left()).toBe("baz");
        expect(control.down()).toBe("baz");
        expect(control.up()).toBe("foo");
    });
});

describe("nodemap Navigator", () => {
    const nodemap = new Navigator([
        ["foo", "foo"],
        ["bar", "baz"],
    ]);
    const control = nodemap.getControl(() => {});

    test("backref", () => {
        expect(control.getNode()).toBe("foo");
        expect(control.down()).toBe("bar");
        expect(control.right()).toBe("baz");
        expect(control.up()).toBe("foo");
        expect(control.down()).toBe("baz");
    });
});
