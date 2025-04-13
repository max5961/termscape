import { describe, test, expect } from "vitest";
import { Navigator } from "@src/nodemap/Navigator.js";

describe("nodemap Navigator", () => {
    const nodemap = new Navigator([
        ["foo", "bar"],
        ["baz", "ban"],
    ]);

    const control = nodemap.getControl(() => {});

    test("start focus position", () => {
        expect(control.getNode()).toBe("foo");
        expect(control.getIndex()).toBe(0);
    });

    test("movements", () => {
        expect(control.right()).toBe("bar");
        expect(control.down()).toBe("ban");
        expect(control.left()).toBe("baz");
        expect(control.up()).toBe("foo");
    });
});
