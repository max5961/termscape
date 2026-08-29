// import { describe, test, expect, beforeEach } from "vitest";
// import { PartialObjectWithDefaults } from "../../src/kernel/style/PartialObjectWithDefaults.js";
//
// type Defaults = {
//     a?: string;
//     b?: string;
//     c?: string;
//     d?: string;
//     e?: string;
//     f?: string;
// };
//
// describe("PartialObjectWithDefaults", () => {
//     let o: PartialObjectWithDefaults<Defaults>;
//     let t: Defaults;
//     beforeEach(() => {
//         o = new PartialObjectWithDefaults({
//             a: "a",
//             b: "b",
//         });
//         t = o.getTarget();
//     });
//
//     test("initializes target with defaults", () => {
//         expect(t).toEqual({
//             a: "a",
//             b: "b",
//         });
//     });
//
//     test("initializes with correct active keys", () => {
//         expect(o.getActiveKeys()).toEqual(["a", "b"]);
//     });
//
//     test("when setting a key with a default value to undefined, the target keeps the default", () => {
//         o.setKey("a", undefined);
//         expect(t).toEqual({
//             a: "a",
//             b: "b",
//         });
//     });
//
//     test("when setting a key with a default value to undefined, the key remains active", () => {
//         o.setKey("a", undefined);
//         expect(o.getActiveKeys()).toEqual(["a", "b"]);
//     });
//
//     test("can override a defaults", () => {
//         o.setKey("a", "A");
//         expect(t).toEqual({
//             a: "A",
//             b: "b",
//         });
//     });
//
//     test("setting a new key", () => {
//         o.setKey("c", "c");
//         expect(t).toEqual({
//             a: "a",
//             b: "b",
//             c: "c",
//         });
//
//         expect(o.getActiveKeys()).toEqual(["a", "b", "c"]);
//     });
//
//     test("setting a new key and unsetting it", () => {
//         o.setKey("c", "c");
//         o.setKey("c", undefined);
//
//         expect(t).toEqual({
//             a: "a",
//             b: "b",
//             c: undefined,
//         });
//
//         expect(o.getActiveKeys()).toEqual(["a", "b"]);
//     });
//
//     test("setting next target merges with defaults", () => {
//         o.setNext({ b: "B", c: "c", d: "d" });
//
//         expect(t).toEqual({
//             a: "a",
//             b: "B",
//             c: "c",
//             d: "d",
//         });
//
//         expect(o.getActiveKeys()).toEqual(["a", "b", "c", "d"]);
//     });
// });
