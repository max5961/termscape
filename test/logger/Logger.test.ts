import { describe, test, expect, afterEach } from "vitest";
import { Logger } from "@src/logger/Logger.js";
import fs from "node:fs";

const TIME = "TIME_PLACEHOLDER:";

describe("Logger", () => {
    const logger = new Logger({
        time: false,
    });
    const file = logger.getFilePath();
    const read = () => readFile(file);

    removeFile(file);
    afterEach(() => removeFile(file));

    test("write - single argument", () => {
        logger.write("foobar");
        expect(read()).toBe("foobar\n");
    });

    test("write - multiple arguments", () => {
        logger.write("foo", "bar", "baz");
        expect(read()).toBe("foo, bar, baz\n");
    });

    test("write - appends to file", () => {
        logger.write("foo");
        logger.write("bar");
        logger.write("baz");
        expect(read()).toBe(`foo\nbar\nbaz\n`);
    });

    test("write - w/ time", () => {
        logger.setDefaultProfile({
            time: () => TIME,
        });

        logger.write("foobar");
        expect(read()).toBe(`${TIME} foobar\n`);
    });

    test("write - w/ prefix", () => {
        logger.setDefaultProfile({
            time: false,
            prefix: "PREFIX",
            prefixSeparator: "--->",
        });

        logger.write("foobar");
        expect(read()).toBe(`PREFIX ---> foobar\n`);
    });

    test("write - w/ prefix & time", () => {
        logger.setDefaultProfile({
            time: () => TIME,
            prefix: "PREFIX",
            prefixSeparator: "--->",
        });

        logger.write("foobar");
        expect(read()).toBe(`${TIME} PREFIX ---> foobar\n`);
    });

    test("write - data types", () => {
        logger.setDefaultProfile({ time: false });

        logger.write(
            null,
            undefined,
            true,
            false,
            12345,
            BigInt(12345),
            Symbol("foo"),
            () => "foo",
        );

        expect(read()).toBe(
            'null, undefined, true, false, 12345, 12345n, Symbol(foo), () => "foo"\n',
        );
    });

    test("write JSON objects w/ length < 25", () => {
        const data = { foo: "foo", bar: "bar" };
        logger.write(data);
        expect(read()).toBe(`${JSON.stringify(data)}\n`);
    });

    test("write JSON arrays w/ length < 25", () => {
        const data = [1, 2, 3, 4, 5];
        logger.write(data);
        expect(read()).toBe(`${JSON.stringify(data)}\n`);
    });

    test("multiple JSON w/ length < 25", () => {
        const data = { foo: "foo" };
        const data2 = [1, 2, 3, 4, 5];
        logger.write(data, data, data2);
        expect(read()).toBe(
            `${JSON.stringify(data)}, ${JSON.stringify(data)}, ${JSON.stringify(data2)}\n`,
        );
    });

    test("write single JSON object w/ length > 25", () => {
        const data = { foo: "foo", bar: "bar", baz: "baz" };
        logger.write(data);
        expect(read()).toBe(`${JSON.stringify(data, null, 4)}\n`);
    });

    test("write multiple JSON object w/ length > 25", () => {
        const data = { foo: "foo", bar: "bar", baz: "baz" };
        logger.write(data, data, data);
        const stringified = JSON.stringify(data, null, 4);
        expect(read()).toBe(`${stringified},\n${stringified},\n${stringified}\n`);
    });
});

describe("Logger profiles", () => {
    const logger = new Logger<"foo" | "bar" | "baz">({
        time: false,
    });
    const file = logger.getFilePath();
    const read = () => readFile(file);

    afterEach(() => removeFile(file));

    logger.defineProfiles({
        foo: {
            time: false,
            prefix: "FOO",
            prefixSeparator: "->",
        },
        bar: {
            time: false,
            prefix: "BAR",
            prefixSeparator: "-->",
        },
        baz: {
            time: false,
            prefix: "BAZ",
            prefixSeparator: "--->",
        },
    });

    test("foo profile", () => {
        logger.use("foo").write("foo");
        expect(read()).toBe("FOO -> foo\n");
    });

    test("bar profile", () => {
        logger.use("bar").write("bar");
        expect(read()).toBe("BAR --> bar\n");
    });

    test("baz profile", () => {
        logger.use("baz").write("baz");
        expect(read()).toBe("BAZ ---> baz\n");
    });

    test("getProfiles", () => {
        const fooLogger = logger.getProfile("foo");
        fooLogger?.write("foo", "bar", "baz");
        expect(read()).toBe("FOO -> foo, bar, baz\n");
    });

    removeFile(file);
});

function readFile(fpath: string): string {
    const contents = fs.readFileSync(fpath, "utf-8");
    return contents;
}

function removeFile(fpath: string): void {
    fs.unlinkSync(fpath);
}
