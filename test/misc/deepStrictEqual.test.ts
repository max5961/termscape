import { describe, test, expect } from "vitest";
import { deepStrictEqual } from "@src/internal/util/deepStrictEqual.js";

describe("deepStrictEqual, no recursive", () => {
    test("null, null", () => expect(deepStrictEqual(null, null)).toBe(true));
    test("undefined, null", () => expect(deepStrictEqual(undefined, null)).toBe(false));
    test("{}, {}", () => expect(deepStrictEqual({}, {})).toBe(true));
    test("[], []", () => expect(deepStrictEqual([], [])).toBe(true));
    test("[], {}", () => expect(deepStrictEqual([], {})).toBe(false));
    test("foo, foo", () => expect(deepStrictEqual("foo", "foo")).toBe(true));
    test("foo, bar", () => expect(deepStrictEqual("foo", "bar")).toBe(false));
    test("'', ''", () => expect(deepStrictEqual("", "")).toBe(true));
    test("1,2", () => expect(deepStrictEqual(1, 2)).toBe(false));
    test("1,1", () => expect(deepStrictEqual(1, 1)).toBe(true));
    test("undefined, undefined", () =>
        expect(deepStrictEqual(undefined, undefined)).toBe(true));
    test("[1,2], {0:1, 1: 2}", () =>
        expect(deepStrictEqual([1, 2], { 0: 1, 1: 2 })).toBe(false));

    test("classes are always false", () => {
        class Foo {
            public a: string;
            private b: string;
            constructor() {
                this.a = "foo";
                this.b = "bar";
            }
            private bar(): void {}
        }
        const a = new Foo();
        const b = new Foo();
        expect(deepStrictEqual(a, b)).toBe(false);
        expect(deepStrictEqual(a, a)).toBe(false);
        expect(deepStrictEqual(a, "a")).toBe(false);
    });

    test("functions", () => {
        expect(
            deepStrictEqual(
                () => {},
                () => {},
            ),
        ).toBe(false);
    });

    test("object", () => {
        const a = { foo: "foo", bar: "bar", baz: "baz" };
        const b = { foo: "foo", bar: "bar", baz: "baz" };
        expect(deepStrictEqual(a, b)).toBe(true);
    });

    test("object, incorrect values", () => {
        const a = { foo: "foobar", bar: "bar", baz: "baz" };
        const b = { foo: "foo", bar: "bar", baz: "baz" };
        expect(deepStrictEqual(a, b)).toBe(false);
    });

    test("object, incorrect num keys", () => {
        const a = { foo: "foo", bar: "bar" };
        const b = { foo: "foo", bar: "bar", baz: "baz" };
        expect(deepStrictEqual(a, b)).toBe(false);
    });

    test("object, incorrect key names", () => {
        const a = { foobar: "foo", bar: "bar" };
        const b = { foo: "foo", bar: "bar", baz: "baz" };
        expect(deepStrictEqual(a, b)).toBe(false);
    });

    test("array", () => {
        const a = [1, 2, 3, 4, 5];
        const b = [1, 2, 3, 4, 5];
        expect(deepStrictEqual(a, b)).toBe(true);
    });

    test("array", () => {
        const a = [1, 2, 3, 4, 5, 6];
        const b = [1, 2, 3, 4, 5];
        expect(deepStrictEqual(a, b)).toBe(false);
    });

    test("array", () => {
        const a = [1, 2, 3, 4, 5];
        const b = [5, 4, 3, 2, 1];
        expect(deepStrictEqual(a, b)).toBe(false);
    });

    test("array of objects", () => {
        const a = [{ foo: "foo" }, { bar: "bar" }, { baz: "baz" }];
        const b = [{ foo: "foo" }, { bar: "bar" }, { baz: "baz" }];
        expect(deepStrictEqual(a, b)).toBe(true);
    });

    test("array of objects, incorrect key names", () => {
        const a = [{ foobar: "foo" }, { bar: "bar" }, { baz: "baz" }];
        const b = [{ foo: "foo" }, { bar: "bar" }, { baz: "baz" }];
        expect(deepStrictEqual(a, b)).toBe(false);
    });

    test("array of objects, incorrect num keys", () => {
        const a = [{ foo: "foo", bar: "bar" }, { bar: "bar" }, { baz: "baz" }];
        const b = [{ foo: "foo" }, { bar: "bar" }, { baz: "baz" }];
        expect(deepStrictEqual(a, b)).toBe(false);
    });
});

describe("deepStrictEqual, recursive", () => {
    const fooFn = () => {};

    test("object, recursive", () => {
        const a = { foo: "foo", bar: { baz: "baz" } };
        const b = { foo: "foo", bar: { baz: "baz" } };
        expect(deepStrictEqual(a, b)).toBe(true);
    });

    test("deeply nested obj - equal", () => {
        const a = {
            foo: "foo",
            bar: [1, 2, 3, 4, 5],
            baz: {
                foo: {
                    bar: {
                        baz: ["a", "b", "c", fooFn],
                        quz: [
                            {
                                foo: "foo",
                                bar: { baz: [{ foo: "foo" }, { bar: "bar" }] },
                            },
                        ],
                    },
                },
            },
        };
        const b = {
            foo: "foo",
            bar: [1, 2, 3, 4, 5],
            baz: {
                foo: {
                    bar: {
                        baz: ["a", "b", "c", fooFn],
                        quz: [
                            {
                                foo: "foo",
                                bar: { baz: [{ foo: "foo" }, { bar: "bar" }] },
                            },
                        ],
                    },
                },
            },
        };

        expect(deepStrictEqual(a, b)).toBe(true);
    });

    test("deeply nested obj - unequal", () => {
        const a = {
            foo: "foo",
            bar: [1, 2, 3, 4, 5],
            baz: {
                foo: {
                    bar: {
                        baz: ["a", "b", "c", "d"],
                        quz: [
                            {
                                foo: "foo",
                                // modified
                                bar: { baz: [{ foo: "foo" }, { bar: "MUTATED" }] },
                            },
                        ],
                    },
                },
            },
        };
        const b = {
            foo: "foo",
            bar: [1, 2, 3, 4, 5],
            baz: {
                foo: {
                    bar: {
                        baz: ["a", "b", "c", "d"],
                        quz: [
                            {
                                foo: "foo",
                                bar: { baz: [{ foo: "foo" }, { bar: "bar" }] },
                            },
                        ],
                    },
                },
            },
        };

        expect(deepStrictEqual(a, b)).toBe(false);
    });

    test("deeply nested array - equal", () => {
        const a = [[[[[[[[1]]]]]]]];
        const b = [[[[[[[[1]]]]]]]];
        expect(deepStrictEqual(a, b)).toBe(true);
    });

    test("deeply nested array - unequal", () => {
        const a = [[[[[[[[1]]]]]]]];
        const b = [[[[[[[1]]]]]]];
        expect(deepStrictEqual(a, b)).toBe(false);
    });

    test("nested arrays - equal", () => {
        // prettier-ignore
        const a = [
            ["a", "b", "c"],
            ["a", "b",],
            ["a"],
        ]
        // prettier-ignore
        const b = [
            ["a", "b", "c"],
            ["a", "b",],
            ["a"],
        ]

        expect(deepStrictEqual(a, b)).toBe(true);
    });

    test("nested arrays - unequal", () => {
        // prettier-ignore
        const a = [
            ["a", "b", "c"],
            ["a", "b",],
            ["MUTATED"],
        ]
        // prettier-ignore
        const b = [
            ["a", "b", "c"],
            ["a", "b",],
            ["a"],
        ]

        expect(deepStrictEqual(a, b)).toBe(false);
    });
});
