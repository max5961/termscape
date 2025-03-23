import { describe, expect, test } from "vitest";
import { diff } from "@src/reconciler/diff.js";

describe("diffing function", () => {
    test("no diff", () => {
        expect(
            diff(
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
        expect(diff(undefined as any, {})).toStrictEqual({});
        expect(diff(undefined as any, undefined as any)).toStrictEqual(null);
        expect(diff({}, undefined as any)).toStrictEqual({});
        expect(diff({ foo: "foo" }, undefined as any)).toStrictEqual({ foo: undefined });
    });

    test("remove prop", () => {
        expect(
            diff(
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
            diff(
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

    test("style prop - no diff", () => {
        expect(
            diff(
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
            diff(
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
            diff(
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

    test("style prop - nested beyond 1 level always diff", () => {
        expect(
            diff(
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
});
