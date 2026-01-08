import termscape from "@src/index.js";
import { describe } from "vitest";
import { defaultSuite } from "test/createSuite.js";
import type { Style } from "@src/dom/style/Style.js";
import type { BorderMap } from "@src/shared/Boxes.js";

const SUITE = "borders";

const run = defaultSuite(SUITE);

async function runTest(style: Exclude<Style.Box["borderStyle"], undefined | BorderMap>) {
    await run(
        style,
        termscape.createElement("box", {
            style: {
                height: 10,
                width: 20,
                borderStyle: style,
            },
        }),
    );
}

describe(SUITE, async () => {
    await runTest("single");
    await runTest("round");
    await runTest("bold");
    await runTest("block");
    await runTest("double");
    await runTest("doubleY");
    await runTest("doubleX");
    await runTest("classic1");
    await runTest("classic2");
});
