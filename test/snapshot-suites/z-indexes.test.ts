import termscape from "@src/index.js";
import { defaultTestSuite } from "./util/defaultTestSuite.js";
import { describe } from "vitest";

const SUITE = "z indexes";
const run = defaultTestSuite(SUITE);

describe(SUITE, async () => {
    await run(
        "no zindex is 'transparent' (doesn't clear bg)",
        termscape.create.box({
            style: {
                height: 20,
                width: 40,
                borderStyle: "round",
                backgroundStyle: "dotted",
            },
            children: [
                termscape.create.box({
                    style: {
                        height: 10,
                        width: 20,
                        borderStyle: "round",
                        position: "absolute",
                        marginTop: 5,
                        marginLeft: 5,
                    },
                }),
            ],
        }),
    );
    await run(
        "unstacked zindex clears bg",
        termscape.create.box({
            style: {
                height: 20,
                width: 40,
                borderStyle: "round",
                backgroundStyle: "dotted",
            },
            children: [
                termscape.create.box({
                    style: {
                        height: 10,
                        width: 20,
                        borderStyle: "round",
                        position: "absolute",
                        marginTop: 5,
                        marginLeft: 5,
                        zIndex: 1,
                    },
                }),
            ],
        }),
    );
    await run(
        "stacked zindex clears both bgs",
        termscape.create.box({
            style: {
                height: 20,
                width: 40,
                borderStyle: "round",
                backgroundStyle: "dotted",
            },
            children: [
                termscape.create.box({
                    style: {
                        height: 10,
                        width: 20,
                        borderStyle: "round",
                        backgroundStyle: "dashed",
                        position: "absolute",
                        marginTop: 5,
                        marginLeft: 5,
                        zIndex: 1,
                    },
                    children: [
                        termscape.create.box({
                            style: {
                                height: 5,
                                width: 10,
                                borderStyle: "round",
                                marginTop: 2,
                                marginLeft: 2,
                                zIndex: 1,
                            },
                        }),
                    ],
                }),
            ],
        }),
    );
});
