import termscape from "@src/index.js";
import { describe } from "vitest";
import { defaultTestSuite } from "./util/defaultTestSuite.js";
import { DEFAULT_TEST_RUNTIME } from "@src/testing/defaultSuite.js";

const SUITE = "resize wrapped text elements";
const run = defaultTestSuite(SUITE);

describe(SUITE, async () => {
    await run("wrapped text is not clipped when increasing width via resize", (root) => {
        const container = termscape.create.box({
            style: {
                width: "100vw",
                height: "100vh",
                borderStyle: "round",
                flexDirection: "row",
                justifyContent: "flex-start",
                overflow: "hidden",
                gap: 1,
            },
            children: ["foobar", "bazban", "quzqux"].map((text) => {
                return termscape.create.box({
                    style: {
                        width: "100",
                        height: 3,
                        overflow: "hidden",
                        justifyContent: "center",
                        borderStyle: "round",
                    },
                    children: [
                        termscape.create.text({
                            textContent: text,
                            style: {
                                wrap: "wrap",
                            },
                        }),
                    ],
                });
            }),
        });

        const dftcols = DEFAULT_TEST_RUNTIME.columns;

        root.sendOps([
            () =>
                root.dispatchResizeEvent("offset", {
                    rows: 0,
                    columns: -(dftcols - 5),
                }),
            ...Array.from({ length: 50 }).map(() => {
                return () =>
                    root.dispatchResizeEvent("offset", {
                        rows: 0,
                        columns: 1,
                    });
            }),
        ]);

        return container;
    });
});
