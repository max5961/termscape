import { describe, test, expect } from "vitest";
import { Scroll } from "@src/internal/scroll/Scroll.js";

// Todo: Account for deleting items from end of list which will force an invalid idx
describe("Scroll", () => {
    const opts: Scroll["opts"] = {
        length: 20,
        windowsize: 5,
        centerScroll: false,
        fallthrough: false,
        autoShiftOnAppend: true,
        stickyIdxOnShift: true,
    };

    const scroll = new Scroll(opts);

    test("Initial state", () => {
        expect(scroll.getData()).toEqual({ idx: 0, start: 0, end: 5 });
    });

    test("goToIndex out of bounds", () => {
        const expected = { idx: 0, start: 0, end: 5 };
        scroll.goToIndex(20);
        expect(scroll.getData()).toEqual(expected);
        scroll.goToIndex(-5);
        expect(scroll.getData()).toEqual(expected);
    });

    test("goToIndex in bounds", () => {
        scroll.goToIndex(10);
        expect(scroll.getData()).toEqual({ idx: 10, start: 6, end: 11 });
    });

    test("center idx", () => {
        scroll.centerIdx();
        expect(scroll.getData()).toEqual({ idx: 10, start: 8, end: 13 });
    });

    /*
     * For the next few operations:
     *
     * Window size changes always seek to modify the end value first and for as long
     * as possible before modifying the start value
     * */

    test("dec window size - idx at end", () => {
        scroll.goToIndex(12);
        scroll.modifyWinSize(3);
        expect(scroll.getData()).toEqual({ idx: 12, start: 10, end: 13 });
    });

    test("dec window size - 0 window size", () => {
        scroll.modifyWinSize(0);
        expect(scroll.getData()).toEqual({ idx: 12, start: 12, end: 12 });
    });

    test("inc window size", () => {
        scroll.modifyWinSize(5);
        expect(scroll.getData()).toEqual({ idx: 12, start: 12, end: 17 });
    });

    test("inc window size beyond possible range maximizes possible window", () => {
        scroll.modifyWinSize(1000);
        expect(scroll.getData()).toEqual({ idx: 12, start: 0, end: 20 });
    });

    // Always moves end first, so end will be + 1 to idx
    test("dec window wize - modify start and end", () => {
        scroll.modifyWinSize(5);
        expect(scroll.getData()).toEqual({ idx: 12, start: 8, end: 13 });
    });

    test("delete item at end", () => {
        scroll.goToIndex(opts.length - 1);
        expect(scroll.getData()).toEqual({ idx: 19, start: 15, end: 20 });

        // Simulate deleting item (shortening length)
        scroll.updateOpts({
            ...opts,
            windowsize: 5,
            length: 19,
        });
        expect(scroll.getData()).toEqual({ idx: 18, start: 14, end: 19 });
    });

    test("delete multiple items", () => {
        scroll.updateOpts({
            ...opts,
            windowsize: 5,
            length: 10,
        });
        expect(scroll.getData()).toEqual({ idx: 9, start: 5, end: 10 });
    });

    test("add single item, autoShiftOnAppend should slide window up one unit", () => {
        scroll.updateOpts({
            ...opts,
            windowsize: 5,
            length: 11,
        });

        expect(scroll.getData()).toEqual({ idx: 9, start: 6, end: 11 });
    });

    test("add multiple items, autoShiftOnAppend should slide window up but not cut off idx", () => {
        scroll.updateOpts({
            ...opts,
            windowsize: 5,
            length: 20,
        });

        expect(scroll.getData()).toEqual({ idx: 9, start: 9, end: 14 });
    });

    test("add multiple items, autoShiftOnAppend slides window AND idx (stickyIdxOnAppend = false)", () => {
        scroll.goToIndex(19);
        expect(scroll.getData()).toEqual({ idx: 19, start: 15, end: 20 });

        scroll.updateOpts({
            ...opts,
            windowsize: 5,
            length: 40,
            stickyIdxOnShift: false,
        });

        expect(scroll.getData()).toEqual({ idx: 35, start: 35, end: 40 });

        // reset opts
        scroll.updateOpts({
            ...opts,
            windowsize: 5,
            length: 40,
            stickyIdxOnShift: true,
        });
    });

    test("delete single item NOT at end - preserves windowsize", () => {
        scroll.goToIndex(35);
        expect(scroll.getData()).toEqual({ idx: 35, start: 35, end: 40 });

        scroll.updateOpts({
            ...opts,
            windowsize: 5,
            length: 39,
        });
        expect(scroll.getData()).toEqual({ idx: 35, start: 34, end: 39 });

        scroll.updateOpts({
            ...opts,
            windowsize: 5,
            length: 38,
        });
        expect(scroll.getData()).toEqual({ idx: 35, start: 33, end: 38 });

        scroll.updateOpts({
            ...opts,
            windowsize: 5,
            length: 37,
        });
        expect(scroll.getData()).toEqual({ idx: 35, start: 32, end: 37 });

        scroll.updateOpts({
            ...opts,
            windowsize: 5,
            length: 36,
        });
        expect(scroll.getData()).toEqual({ idx: 35, start: 31, end: 36 });
    });
});
