import { describe, expect, test } from "vitest";
import { getUpdatePayload } from "@src/react/util/getUpdatePayload.js";

describe("diffing function", () => {
    test("no change", () => {
        const prev = { foo: "foo", bar: "bar" };
        const next = { foo: "foo", bar: "bar" };
        const payload = getUpdatePayload(prev, next);

        expect(payload).toStrictEqual(null);
    });

    test("argument edge cases", () => {
        expect(getUpdatePayload(undefined as any, {})).toStrictEqual({});
        expect(getUpdatePayload(undefined as any, undefined as any)).toStrictEqual(null);
        expect(getUpdatePayload({}, undefined as any)).toStrictEqual({});
        expect(getUpdatePayload({ foo: "foo" }, undefined as any)).toStrictEqual({
            foo: undefined,
        });
        expect(getUpdatePayload(undefined as any, [] as any)).toStrictEqual([]);
        expect(getUpdatePayload({ style: { foo: "foo" } }, { style: [] })).toStrictEqual({
            style: [],
        });
    });

    test("remove prop", () => {
        const prev = { foo: "foo", bar: "bar" };
        const next = { foo: "foo" };
        const payload = getUpdatePayload(prev, next);

        expect(payload).toStrictEqual({ foo: "foo", bar: undefined });
        expect(payload).not.toStrictEqual({ foo: "foo" });
    });

    test("add prop", () => {
        const prev = { foo: "foo", bar: "bar" };
        const next = { foo: "foo", bar: "bar", baz: "baz" };
        const payload = getUpdatePayload(prev, next);

        expect(payload).toStrictEqual({ foo: "foo", bar: "bar", baz: "baz" });
    });

    test("add prop and remove prop", () => {
        const prev = { foo: "foo", bar: "bar", baz: "baz" };
        const next = { bar: "bar", baz: "baz" };
        const payload = getUpdatePayload(prev, next);

        expect(payload).toStrictEqual({ foo: undefined, bar: "bar", baz: "baz" });
        expect(payload).not.toStrictEqual({ bar: "bar", baz: "baz" });
    });

    test("nested props - no change", () => {
        const prev = {
            props: { style: { foo: "foo", bar: "bar" }, baz: "foo" },
            metadata: { ID: "123" },
        };
        const next = {
            props: { style: { foo: "foo", bar: "bar" }, baz: "foo" },
            metadata: { ID: "123" },
        };
        const payload = getUpdatePayload(prev, next);

        expect(payload).toStrictEqual(null);
    });

    test("nested props - remove", () => {
        const prev = {
            props: { style: { foo: "foo", bar: "bar" }, baz: "baz" },
            metadata: { ID: "123" },
        };
        const next = {
            props: { style: { foo: "foo" }, baz: undefined },
            metadata: { ID: "123" },
        };
        const payload = getUpdatePayload(prev, next);

        expect(payload).toStrictEqual({
            props: { style: { foo: "foo", bar: undefined }, baz: undefined },
            metadata: { ID: "123" },
        });
    });

    test("nested props - add", () => {
        const prev = {
            props: { style: { foo: "foo", bar: "bar" }, baz: "foo" },
            metadata: { ID: "123" },
        };
        const next = {
            props: { style: { foo: "foo", bar: "bar", baz: "baz" }, baz: "baz" },
            metadata: { ID: "123" },
        };
        const payload = getUpdatePayload(prev, next);

        expect(payload).toStrictEqual({
            props: { style: { foo: "foo", bar: "bar", baz: "baz" }, baz: "baz" },
            metadata: { ID: "123" },
        });
    });

    test("nested props - add and remove", () => {
        const prev = {
            props: { style: { foo: "foo", bar: "bar" }, baz: "foo" },
            metadata: { ID: "123" },
        };
        const next = {
            props: { style: { foo: "foo", baz: "baz", quz: "quz" }, baz: "baz" },
            metadata: { ID: "123" },
        };
        const payload = getUpdatePayload(prev, next);

        expect(payload).toStrictEqual({
            props: {
                style: { foo: "foo", bar: undefined, baz: "baz", quz: "quz" },
                baz: "baz",
            },
            metadata: { ID: "123" },
        });
    });

    test("does not recurse on invalid keys", () => {
        // Diff returns null on no change, so we want a change here since it
        // only recurses on valid obj keys
        expect(
            getUpdatePayload(
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

    test("handles removing a key that is a valid object key - (next props.style is removed)", () => {
        const prev = {
            props: {
                style: {
                    foo: "foo",
                    bar: "bar",
                },
                baz: "baz",
            },
            metadata: { ID: "123" },
        };
        const next = {
            props: {
                baz: "baz",
            },
            metadata: { ID: "123" },
        };
        const payload = getUpdatePayload(prev, next);

        expect(payload).toStrictEqual({
            props: {
                style: {
                    foo: undefined,
                    bar: undefined,
                },
                baz: "baz",
            },
            metadata: { ID: "123" },
        });
        expect(payload).not.toStrictEqual({
            props: {
                style: {},
                baz: "baz",
            },
            metadata: { ID: "123" },
        });
    });

    test("prev style prop does not exist, but next style prop exists", () => {
        expect(
            getUpdatePayload(
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
            getUpdatePayload(
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
            getUpdatePayload(
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
