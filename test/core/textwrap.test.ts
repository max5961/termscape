import { describe, test, expect } from "vitest";
import { textWrap } from "../../src/core/text/textwrap.js";

describe("Text wrapping", () => {
    test("Empty string", () => {
        const rows = textWrap("", 3);
        expect(rows).toEqual([]);
    });

    test("Whitespace only", () => {
        const rows = textWrap(" ", 3);
        expect(rows).toEqual([" "]);
    });

    test("Whitespace only and exceeds width", () => {
        const rows = textWrap("    ", 3);
        expect(rows).toEqual(["   ", " "]);
    });

    test("Width of 1", () => {
        const rows = textWrap("foo", 1);
        expect(rows).toEqual(["f", "o", "o"]);
    });

    test("Width of 0", () => {
        const rows = textWrap("foo", 0);
        expect(rows).toEqual(["f", "o", "o"]);
    });

    test("Same width", () => {
        const rows = textWrap("foo", 3);
        expect(rows).toEqual(["foo"]);
    });

    test("Preceding whitspace on first row is included", () => {
        const rows = textWrap(" foo", 4);
        expect(rows).toEqual([" foo"]);
    });

    test("Preceding whitespace on first row forces word onto next line", () => {
        const rows = textWrap(" foo", 3);
        expect(rows).toEqual([" ", "foo"]);
    });

    test("Excess whitespace", () => {
        const rows = textWrap("foo  ", 5);
        expect(rows).toEqual(["foo  "]);
    });

    test("Excess whitespace that extends width should create new row", () => {
        const rows = textWrap("foo    ", 5);
        expect(rows).toEqual(["foo  ", "  "]);
    });

    test("Excess whitespace should continue to make rows with whitespace", () => {
        const rows = textWrap("      ", 2);
        expect(rows).toEqual(["  ", "  ", "  "]);
    });

    test("Each word is same length as width", () => {
        const rows = textWrap("foo bar baz", 3);
        expect(rows).toEqual(["foo", " ", "bar", " ", "baz"]);
    });

    test("New row with word respects preceding whitespace", () => {
        const rows = textWrap("foo    ba", 3);
        expect(rows).toEqual(["foo", "   ", " ba"]);
    });

    test("Whitespace before broken word appends new row", () => {
        const rows = textWrap("foo    baz", 3);
        expect(rows).toEqual(["foo", "   ", " ", "baz"]);
    });

    test("Words greater than width", () => {
        const rows = textWrap("foobar bazban", 3);
        expect(rows).toEqual(["foo", "bar", " ", "baz", "ban"]);
    });

    test("Words greater than width with unclean breaks", () => {
        const rows = textWrap("foobar bazban", 4);
        expect(rows).toEqual(["foob", "ar ", "bazb", "an"]);
    });

    test("Single word longer than width", () => {
        const rows = textWrap("foobarbazban", 5);
        expect(rows).toEqual(["fooba", "rbazb", "an"]);
    });

    test("Whitespace appends new line and keeps ws", () => {
        const rows = textWrap("foo bar", 4);
        expect(rows).toEqual(["foo ", "bar"]);
    });

    test.todo("Whitespace wider than width", () => {
        const rows = textWrap("    ", 2);
        expect(rows).toEqual(["  ", "  "]);
    });

    test.todo("Whitespace wider than width padded left by non-whitespace", () => {
        // 7 ws
        const rows = textWrap("foo       ", 4);
        expect(rows).toEqual(["foo ", "    ", "  "]);
    });

    test.todo(
        "Whitespace wider than width padding left and right by non-whitespace",
        () => {
            // 4 ws
            const rows = textWrap("foo    bar", 2);
            expect(rows).toEqual(["fo", "o ", "  ", " b", "ar"]);
        },
    );
});

describe("Wrapping with control characters", () => {
    test("newlines", () => {
        const rows = textWrap("foo\nbar\nbaz\n", 5);
        expect(rows).toEqual(["foo", "bar", "baz", ""]);
    });

    test("tabWidth set to 4 treats tabs as if they are 4 spaces", () => {
        const rows = textWrap("foo\tbar", 4, 4);
        expect(rows).toEqual(["foo ", "   ", "bar"]);
    });

    // These are handled in the whitespace wider than width in the above suite
    test.skip("width less than tab width", () => {
        const rows = textWrap("\t", 2, 4);
        expect(rows).toEqual(["  ", "  "]);
    });
    test.skip("width less than tab width", () => {
        const rows = textWrap("foo\tbar", 2);
        expect(rows).toEqual(["fo", "o ", "  ", " b", "ar"]);
    });
});
