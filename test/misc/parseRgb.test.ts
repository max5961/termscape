import { describe, test, expect } from "vitest";
import { parseRgb } from "@src/util/parseRgb.js";

describe("parseRgb - converts rgb string to [number,number, number]", () => {
    const a = "rgb(255, 255, 255)";
    test(`${a}`, () => {
        expect(parseRgb(a)).toEqual([255, 255, 255]);
    });

    const b = "rgb(1, 2, 3)";
    test(`${b}`, () => {
        expect(parseRgb(b)).toEqual([1, 2, 3]);
    });

    const c = " rgb ( 1 , 2 , 3, 4, 5) ";
    test(`${c}`, () => {
        expect(parseRgb(c)).toEqual([1, 2, 3]);
    });

    test("no commas", () => {
        const rgb = "rgb(255 0 0)";
        expect(parseRgb(rgb)).toEqual([255, 0, 0]);
    });

    test("no commas, extra spaces", () => {
        const rgb = "rgb ( 255   0   0 )";
        expect(parseRgb(rgb)).toEqual([255, 0, 0]);
    });
});
