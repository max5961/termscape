import { describe, expect, test } from "vitest";
import { internalDiff } from "@src/reconciler/internalDiff.js";

describe("diffing function", () => {
    test("no internalDiff", () => {
        expect(
            internalDiff(
                {
                    foo: "foo",
                    bar: "bar",
                },
                {
                    foo: "foo",
                    bar: "bar",
                },
            ),
        ).toStrictEqual(null);
    });

    // Possible edge cases
    test("undefined args", () => {
        expect(internalDiff(undefined as any, {})).toStrictEqual({});
        expect(internalDiff(undefined as any, undefined as any)).toStrictEqual(null);
        expect(internalDiff({}, undefined as any)).toStrictEqual({});
        expect(internalDiff({ foo: "foo" }, undefined as any)).toStrictEqual({
            foo: undefined,
        });
    });

    test("remove prop", () => {
        expect(
            internalDiff(
                {
                    foo: "foo",
                    bar: "bar",
                },
                {
                    foo: "foo",
                },
            ),
        ).toStrictEqual({ foo: "foo", bar: undefined });
    });

    test("add prop", () => {
        expect(
            internalDiff(
                {
                    foo: "foo",
                    bar: "bar",
                },
                {
                    foo: "foo",
                    bar: "bar",
                    baz: "baz",
                },
            ),
        ).toStrictEqual({ foo: "foo", bar: "bar", baz: "baz" });
    });

    test("style prop - no internalDiff", () => {
        expect(
            internalDiff(
                {
                    foo: "foo",
                    style: {
                        bar: "bar",
                        baz: "baz",
                    },
                },
                {
                    foo: "foo",
                    style: {
                        bar: "bar",
                        baz: "baz",
                    },
                },
            ),
        ).toStrictEqual(null);
    });

    test("style prop - remove from style prop", () => {
        expect(
            internalDiff(
                {
                    foo: "foo",
                    style: {
                        bar: "bar",
                        baz: "baz",
                    },
                },
                {
                    foo: "foo",
                    style: {
                        bar: "bar",
                    },
                },
            ),
        ).toStrictEqual({ foo: "foo", style: { bar: "bar", baz: undefined } });
    });

    test("style prop - add to style prop", () => {
        expect(
            internalDiff(
                {
                    foo: "foo",
                    style: {
                        bar: "bar",
                    },
                },
                {
                    foo: "foo",
                    style: {
                        bar: "bar",
                        baz: "baz",
                    },
                },
            ),
        ).toStrictEqual({ foo: "foo", style: { bar: "bar", baz: "baz" } });
    });

    test("style prop - nested beyond 1 level always internalDiff", () => {
        expect(
            internalDiff(
                {
                    foo: "foo",
                    style: {
                        bar: "bar",
                        baz: { foo: "foo" },
                    },
                },
                {
                    foo: "foo",
                    style: {
                        bar: "bar",
                        baz: { foo: "foo" },
                    },
                },
            ),
        ).toStrictEqual({ foo: "foo", style: { bar: "bar", baz: { foo: "foo" } } });
    });

    test("prev style prop had props, but next style prop is removed", () => {
        expect(
            internalDiff(
                {
                    foo: "foo",
                    style: {
                        bar: "bar",
                        baz: "baz",
                    },
                },
                {
                    foo: "foo",
                },
            ),
        ).toStrictEqual({
            foo: "foo",
            style: {
                bar: undefined,
                baz: undefined,
            },
        });
    });

    test("prev style prop does not exist, but next style prop exists", () => {
        expect(
            internalDiff(
                {
                    foo: "foo",
                },
                {
                    foo: "foo",
                    style: {
                        bar: "bar",
                        baz: "baz",
                    },
                },
            ),
        ).toStrictEqual({
            foo: "foo",
            style: {
                bar: "bar",
                baz: "baz",
            },
        });
    });

    test("prev style prop -> style prop w/ undefined prev style prop", () => {
        expect(
            internalDiff(
                {
                    foo: "foo",
                    style: undefined,
                },
                {
                    foo: "foo",
                    style: {
                        bar: "bar",
                        baz: "baz",
                    },
                },
            ),
        ).toStrictEqual({
            foo: "foo",
            style: {
                bar: "bar",
                baz: "baz",
            },
        });
    });

    test("prev style prop -> style prop w/ nested properties", () => {
        expect(
            internalDiff(
                {
                    foo: "foo",
                    style: {
                        bar: undefined,
                        baz: undefined,
                    },
                },
                {
                    foo: "foo",
                    style: {
                        bar: "bar",
                        baz: "baz",
                    },
                },
            ),
        ).toStrictEqual({
            foo: "foo",
            style: {
                bar: "bar",
                baz: "baz",
            },
        });
    });
});
