import termscape from "@src/index.js";
import { defaultTestSuite } from "test/snapshot-suites/util/defaultTestSuite.js";
import { describe } from "node:test";
import type { Style } from "@src/dom/style/Style.js";
import { ColorSet } from "@src/Constants.js";

const SUITE = "background-color";
const run = defaultTestSuite(SUITE);

async function runTest(style: Style.Box["backgroundColor"]) {
    run(
        style ?? "undefined",
        termscape.create.box({
            style: {
                height: 10,
                width: 20,
                borderStyle: "round",
                backgroundColor: style,
            },
        }),
    );
}

describe(SUITE, async () => {
    [...ColorSet.values()].forEach(async (color) => {
        await runTest(color);
    });

    await runTest(undefined);
});
