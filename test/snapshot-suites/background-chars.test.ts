import termscape from "@src/index.js";
import { defaultTestSuite } from "test/snapshot-suites/util/defaultTestSuite.js";
import { describe } from "node:test";
import type { Color } from "@src/Types.js";

const SUITE = "background-chars";
const run = defaultTestSuite(SUITE);

describe(SUITE, async () => {
    const createBox = ({
        char,
        bgStyleColor,
        bgColor,
    }: {
        char: string;
        bgStyleColor?: Color;
        bgColor?: Color;
    }) =>
        termscape.create.box({
            style: {
                height: 5,
                width: 10,
                borderStyle: "round",
                backgroundStyle: { char },
                backgroundStyleColor: bgStyleColor,
                backgroundColor: bgColor,
            },
        });

    await run("handles '' as char argument", () => {
        return createBox({ char: "" });
    });

    await run("handles '' as char argument with blue bg color", () => {
        return createBox({ char: "", bgColor: "blue" });
    });

    await run("accepts any char as a background char", () => {
        return createBox({ char: "^" });
    });

    await run("can set blue bg style color", () => {
        return createBox({ char: "^", bgStyleColor: "blue" });
    });

    await run("can set blue bg color with red bgstyle color", () => {
        return createBox({ char: "^", bgColor: "blue", bgStyleColor: "red" });
    });

    await run("clips strings longer than 1 char 'abcdefg' to 'a' only", () => {
        return createBox({ char: "abcdefg" });
    });

    await run("handles backslash as bg char", () => {
        return createBox({ char: "\\" });
    });
});
