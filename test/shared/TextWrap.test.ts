import { describe, expect, test } from "vitest";
import { getRows, alignRows } from "@src/shared/TextWrap.js";

describe("Text wrapping", () => {
    test("Empty string", () => {
        const rows = getRows("", 3);
        expect(rows).toEqual([]);
    });

    test("Whitespace only", () => {
        const rows = getRows(" ", 3);
        expect(rows).toEqual([" "]);
    });

    test("Whitespace only and exceeds width", () => {
        const rows = getRows("    ", 3);
        expect(rows).toEqual(["   ", ""]);
    });

    test("same width", () => {
        const rows = getRows("foo", 3);
        expect(rows).toEqual(["foo"]);
    });

    test("Preceding whitspace on first row is included", () => {
        const rows = getRows(" foo", 4);
        expect(rows).toEqual([" foo"]);
    });

    test("Preceding whitespace on first row forces word onto next line", () => {
        const rows = getRows(" foo", 3);
        expect(rows).toEqual([" ", "foo"]);
    });

    test("Excess whitespace", () => {
        const rows = getRows("foo  ", 5);
        expect(rows).toEqual(["foo  "]);
    });

    test("Excess whitespace that extends width should create new row", () => {
        const rows = getRows("foo    ", 5);
        expect(rows).toEqual(["foo  ", ""]);
    });

    test("Excess whitespace only creates now rows", () => {
        const rows = getRows("      ", 2);
        expect(rows).toEqual(["  ", "", ""]);
    });

    test("Each word is same length as width", () => {
        const rows = getRows("foo bar baz", 3);
        expect(rows).toEqual(["foo", "", "bar", "", "baz"]);
    });

    test("New rows always trim preceding whitespace", () => {
        const rows = getRows("foo    ba", 3);
        expect(rows).toEqual(["foo", "", "ba"]);
    });

    test("Trimmed starting whitespace appends new rows", () => {
        const rows = getRows("foo    baz", 3);
        expect(rows).toEqual(["foo", "", "", "baz"]);
    });

    test("Words greater than width", () => {
        const rows = getRows("foobar bazban", 3);
        expect(rows).toEqual(["foo", "bar", "", "baz", "ban"]);
    });

    test("Words greater than width with unclean breaks", () => {
        const rows = getRows("foobar bazban", 4);
        expect(rows).toEqual(["foob", "ar ", "bazb", "an"]);
    });

    test("Sigle word longer than width", () => {
        const rows = getRows("foobarbazban", 5);
        expect(rows).toEqual(["fooba", "rbazb", "an"]);
    });
});

describe("Aligning text", () => {
    test("Align start is the same as `getRows`", () => {
        const rows = getRows("foobar bazban", 5);
        const aligned = alignRows(rows, 5, "left");
        expect(rows).toEqual(aligned);
    });

    describe("Align Center", () => {
        test("All words shorter than width", () => {
            const rows = getRows("foo bar baz", 5);
            const aligned = alignRows(rows, 5, "center");
            expect(aligned).toEqual([" foo ", " bar ", " baz "]);
        });

        test("Words longer than width", () => {
            const rows = getRows("foobar bazban", 5);
            const aligned = alignRows(rows, 5, "center");
            expect(aligned).toEqual(["fooba", "  r  ", "bazba", "  n  "]);
        });
    });

    describe("Align End", () => {
        test("All words shorter than width", () => {
            const rows = getRows("foo bar baz", 5);
            const aligned = alignRows(rows, 5, "right");
            expect(aligned).toEqual(["  foo", "  bar", "  baz"]);
        });

        test("Words longer than width", () => {
            const rows = getRows("foobar bazban", 5);
            const aligned = alignRows(rows, 5, "right");
            expect(aligned).toEqual(["fooba", "    r", "bazba", "    n"]);
        });
    });
});
