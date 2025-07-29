import { Canvas } from "@src/canvas/Canvas.js";
import { Cursor } from "@src/render/Cursor.js";
import { PreciseWriter } from "@src/render/write/PreciseWriter.js";
import { describe, expect, test } from "vitest";

type Row = Canvas["grid"][number];

const writer = new PreciseWriter(new Cursor({ debug: false }));

const toRow = (s: string): Row => s.split("");

describe("Gets correct diff slices", () => {
    test("entire row diff", () => {
        const last = toRow("foo");
        const next = toRow("bar");
        const diff = writer.createRowDiff(last, next);
        expect(diff).toEqual([{ s: 0, e: 3 }]);
    });

    test("shorter next row diff", () => {
        const last = toRow("foobar");
        const next = toRow("bar");
        const diff = writer.createRowDiff(last, next);
        expect(diff).toEqual([{ s: 0, e: 3 }]);
    });

    test("longer next row diff", () => {
        const last = toRow("bar");
        const next = toRow("foobar");
        const diff = writer.createRowDiff(last, next);
        expect(diff).toEqual([{ s: 0, e: 6 }]);
    });

    test("not entire row is diff", () => {
        const last = toRow("foo");
        const next = toRow("bao");
        const diff = writer.createRowDiff(last, next);
        expect(diff).toEqual([{ s: 0, e: 2 }]);
    });

    test("shorter next, diff from middle to end", () => {
        const last = toRow("foobarbaz");
        const next = toRow("fooxx");
        const diff = writer.createRowDiff(last, next);
        expect(diff).toEqual([{ s: 3, e: 5 }]);
    });
});
