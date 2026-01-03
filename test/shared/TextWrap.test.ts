import { describe, expect, test } from "vitest";
import { getRows, alignRows } from "@src/shared/TextWrap.js";
import { HIDDEN_TRIMMED_WS, TEXT_PADDING } from "@src/Constants.js";

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
        expect(rows).toEqual(["   ", " "]);
    });

    test("Width of 1", () => {
        const rows = getRows("foo", 1);
        expect(rows).toEqual(["f", "o", "o"]);
    });

    test("Width of 0", () => {
        const rows = getRows("foo", 0);
        expect(rows).toEqual(["f", "o", "o"]);
    });

    test("Same width", () => {
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
        expect(rows).toEqual(["foo  ", "  "]);
    });

    test("Excess whitespace should continue to make rows with whitespace", () => {
        const rows = getRows("      ", 2);
        expect(rows).toEqual(["  ", "  ", "  "]);
    });

    test("Each word is same length as width", () => {
        const rows = getRows("foo bar baz", 3);
        expect(rows).toEqual(["foo", " ", "bar", " ", "baz"]);
    });

    test("New row with word respects preceding whitespace", () => {
        const rows = getRows("foo    ba", 3);
        expect(rows).toEqual(["foo", "   ", " ba"]);
    });

    test("Whitespace before broken word appends new row", () => {
        const rows = getRows("foo    baz", 3);
        expect(rows).toEqual(["foo", "   ", " ", "baz"]);
    });

    test("Words greater than width", () => {
        const rows = getRows("foobar bazban", 3);
        expect(rows).toEqual(["foo", "bar", " ", "baz", "ban"]);
    });

    test("Words greater than width with unclean breaks", () => {
        const rows = getRows("foobar bazban", 4);
        expect(rows).toEqual(["foob", "ar ", "bazb", "an"]);
    });

    test("Single word longer than width", () => {
        const rows = getRows("foobarbazban", 5);
        expect(rows).toEqual(["fooba", "rbazb", "an"]);
    });

    test("Whitespace appends new line and keeps ws", () => {
        const rows = getRows("foo bar", 4);
        expect(rows).toEqual(["foo ", "bar"]);
    });
});

describe("Aligning text", () => {
    test("Align start is the same as `getRows`", () => {
        const rows = getRows("foobar bazban", 5);
        const aligned = alignRows(rows, 5, "left");
        expect(aligned).toEqual(rows.map((row) => row.split("")));
    });

    describe("Align Center", () => {
        test("All words shorter than width", () => {
            const rows = getRows("foo bar baz", 5);
            const aligned = alignRows(rows, 5, "center");
            expect(aligned).toEqual([
                [TEXT_PADDING, "f", "o", "o", HIDDEN_TRIMMED_WS, TEXT_PADDING],
                [TEXT_PADDING, "b", "a", "r", HIDDEN_TRIMMED_WS, TEXT_PADDING],
                [TEXT_PADDING, "b", "a", "z", TEXT_PADDING],
            ]);
        });

        test("Words longer than width", () => {
            const rows = getRows("foobar bazban", 5);
            const aligned = alignRows(rows, 5, "center");
            expect(aligned).toEqual([
                ["f", "o", "o", "b", "a"],
                // prettier-ignore
                [TEXT_PADDING, TEXT_PADDING, "r", HIDDEN_TRIMMED_WS, TEXT_PADDING, TEXT_PADDING],
                ["b", "a", "z", "b", "a"],
                [TEXT_PADDING, TEXT_PADDING, "n", TEXT_PADDING, TEXT_PADDING],
            ]);
        });

        test("Intentional ws at start", () => {
            const rows = getRows("  foo", 5);
            const aligned = alignRows(rows, 5, "center");
            expect(aligned).toEqual([
                // prettier-ignore
                [TEXT_PADDING, HIDDEN_TRIMMED_WS, HIDDEN_TRIMMED_WS, "f", "o", "o", TEXT_PADDING],
            ]);
        });

        test("Intentional ws at end", () => {
            const rows = getRows("foo  ", 5);
            const aligned = alignRows(rows, 5, "center");
            expect(aligned).toEqual([
                // prettier-ignore
                [TEXT_PADDING, "f", "o", "o", HIDDEN_TRIMMED_WS, HIDDEN_TRIMMED_WS, TEXT_PADDING],
            ]);
        });

        test("Intentional ws at start and end", () => {
            const rows = getRows(" foo ", 5);
            const aligned = alignRows(rows, 5, "center");
            expect(aligned).toEqual([
                // prettier-ignore
                [TEXT_PADDING, HIDDEN_TRIMMED_WS, "f", "o", "o", HIDDEN_TRIMMED_WS, TEXT_PADDING],
            ]);
        });

        test("Intentional ws appends new line (4 intentional ws at end)", () => {
            const rows = getRows("foo    ", 5);
            const aligned = alignRows(rows, 5, "center");
            expect(aligned).toEqual([
                // prettier-ignore
                [TEXT_PADDING, "f", "o", "o", HIDDEN_TRIMMED_WS, HIDDEN_TRIMMED_WS, TEXT_PADDING],
                // prettier-ignore
                [TEXT_PADDING, TEXT_PADDING, HIDDEN_TRIMMED_WS, HIDDEN_TRIMMED_WS, TEXT_PADDING, TEXT_PADDING, TEXT_PADDING],
            ]);
        });
    });

    describe("Align End", () => {
        test("All words shorter than width", () => {
            const rows = getRows("foo bar baz", 5);
            const aligned = alignRows(rows, 5, "right");
            expect(aligned).toEqual([
                [TEXT_PADDING, TEXT_PADDING, "f", "o", "o", HIDDEN_TRIMMED_WS],
                [TEXT_PADDING, TEXT_PADDING, "b", "a", "r", HIDDEN_TRIMMED_WS],
                [TEXT_PADDING, TEXT_PADDING, "b", "a", "z"],
            ]);
        });

        test("Words longer than width", () => {
            const rows = getRows("foobar bazban", 5);
            const aligned = alignRows(rows, 5, "right");
            expect(aligned).toEqual([
                ["f", "o", "o", "b", "a"],
                // prettier-ignore
                [TEXT_PADDING, TEXT_PADDING, TEXT_PADDING, TEXT_PADDING, "r", HIDDEN_TRIMMED_WS],
                ["b", "a", "z", "b", "a"],
                [TEXT_PADDING, TEXT_PADDING, TEXT_PADDING, TEXT_PADDING, "n"],
            ]);
        });

        test("Intentional ws at end", () => {
            const rows = getRows("foo  ", 5);
            const aligned = alignRows(rows, 5, "right");
            expect(aligned).toEqual([
                // prettier-ignore
                [TEXT_PADDING, TEXT_PADDING, "f", "o", "o", HIDDEN_TRIMMED_WS, HIDDEN_TRIMMED_WS],
            ]);
        });

        test("Intentional ws at start", () => {
            const rows = getRows("  foo", 5);
            const aligned = alignRows(rows, 5, "right");
            expect(aligned).toEqual([
                // prettier-ignore
                [TEXT_PADDING, TEXT_PADDING, HIDDEN_TRIMMED_WS, HIDDEN_TRIMMED_WS, "f", "o", "o"],
            ]);
        });

        test("Intentional ws at start and end", () => {
            const rows = getRows(" foo ", 5);
            const aligned = alignRows(rows, 5, "right");
            expect(aligned).toEqual([
                // prettier-ignore
                [TEXT_PADDING, TEXT_PADDING, HIDDEN_TRIMMED_WS, "f", "o", "o", HIDDEN_TRIMMED_WS],
            ]);
        });

        test("Intentional ws appends new line (4 intentional ws at end)", () => {
            const rows = getRows("foo    ", 5);
            const aligned = alignRows(rows, 5, "right");
            expect(aligned).toEqual([
                // prettier-ignore
                [TEXT_PADDING, TEXT_PADDING, "f", "o", "o", HIDDEN_TRIMMED_WS, HIDDEN_TRIMMED_WS],
                // The order here is sort of arbitrary which is not the best
                // prettier-ignore
                [
                    TEXT_PADDING, TEXT_PADDING, TEXT_PADDING, TEXT_PADDING, TEXT_PADDING,
                    HIDDEN_TRIMMED_WS, HIDDEN_TRIMMED_WS
                ],
            ]);
        });
    });
});

describe("Wrapping with control characters", () => {
    test("newlines", () => {
        const rows = getRows("foo\nbar\nbaz\n", 5);
        expect(rows).toEqual(["foo", "bar", "baz", ""]);
    });

    test("tabs are treated as 4 spaces", () => {
        const rows = getRows("foo\tbar", 4);
        expect(rows).toEqual(["foo ", "   ", "bar"]);
    });
});
