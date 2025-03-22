import { describe, test, expect, beforeEach } from "vitest";
import { FileConsole } from "@src/public/FileConsole.js";
import fs from "node:fs";

const TIME = "TIME_PLACEHOLDER:";

describe("FileConsole", () => {
    const console = new FileConsole("console.log");
    console.setTime(false);
    const file = console.getPath();

    beforeEach(() => clearFile(file));

    test("write - single argument", () => {
        console.write("foobar");
        expect(readFile(file)).toBe(`foobar\n`);
    });

    test("write - w/ time", () => {
        console.time(() => TIME).write("foobar");
        expect(readFile(file)).toBe(`${TIME} foobar\n`);
    });

    test("write - appends", () => {
        console.write("foo");
        console.write("bar");
        console.write("baz");
        expect(readFile(file)).toBe(`foo\nbar\nbaz\n`);
    });

    test("write - boolean", () => {
        console.write(true);
        console.write(false);
        expect(readFile(file)).toBe(`true\nfalse\n`);
    });

    test("write - null", () => {
        console.write(null);
        expect(readFile(file)).toBe(`null\n`);
    });

    test("write - undefined", () => {
        console.write(undefined);
        expect(readFile(file)).toBe(`undefined\n`);
    });

    test("write - numbers", () => {
        console.write(12345);
        expect(readFile(file)).toBe(`12345\n`);
    });

    test("write - bigint", () => {
        console.write(12345n);
        expect(readFile(file)).toBe(`12345n\n`);
    });

    test("write - function", () => {
        console.write(() => "foobar");
        expect(readFile(file)).toBe(`() => "foobar"\n`);
    });

    test("write - symbol", () => {
        console.write(Symbol("foo"));
        expect(readFile(file)).toBe(`Symbol(foo)\n`);
    });

    test("write - multiple arguments", () => {
        console.write("foo", "bar", "baz", true, false, undefined, null);
        expect(readFile(file)).toBe(`foo, bar, baz, true, false, undefined, null\n`);
    });

    test("write - JSON", () => {
        const data = { foo: "foo", bar: "bar" };
        console.write(data);
        expect(readFile(file)).toBe(`${JSON.stringify(data)}\n`);
    });

    test("write - JSON formats when above 25 length", () => {
        const data = { foo: "foo", bar: "bar", baz: [1, 2, 3, 4, 5] };
        console.write(data);
        expect(readFile(file)).toBe(`${JSON.stringify(data, null, 4)}\n`);
    });

    test("write - multiple JSON", () => {
        const data = { foo: "foo" };
        console.write(data, data, data);
        expect(readFile(file)).toBe(
            `${JSON.stringify(data)}, ${JSON.stringify(data)}, ${JSON.stringify(data)}\n`,
        );
    });

    test.todo("write - formatted JSON adds newline before next arg", () => {
        const data = { foo: "foo", bar: "bar", baz: "baz" };
        console.write(data, "foo");
        expect(readFile(file)).toBe(`${JSON.stringify(data, null, 4)}\n, foo\n`);
    });

    test.todo("write - formatted JSON does not add 2 newlines when last arg", () => {
        const data = { foo: "foo", bar: "bar", baz: "baz" };
        console.write(data, "foo");
        expect(readFile(file)).toBe(`${JSON.stringify(data, null, 4)}\n`);
    });

    clearFile(file);
});

function readFile(fpath: string): string {
    const contents = fs.readFileSync(fpath, "utf-8");
    return contents;
}

function clearFile(fpath: string): void {
    fs.writeFileSync(fpath, "", "utf-8");
}
