import termscape from "@src/index.js";
import { defaultTestSuite } from "./util/defaultTestSuite.js";

const SUITE = "canvas rows";
const run = defaultTestSuite(SUITE);

export const record = async () => {
    await run(
        "no drawing still creates rows",
        termscape.create.box({
            style: {
                height: 5,
                width: 5,
            },
        }),
    );

    await run(
        "removes trailing ws",
        termscape.create.box({
            style: {
                height: "100vh",
                width: "100vw",
                flexDirection: "column",
                gap: 5,
            },
            children: [
                termscape.create.box({
                    style: {
                        height: "100",
                        width: 10,
                        borderStyle: "round",
                    },
                }),
                termscape.create.box({
                    style: {
                        height: "100",
                        width: 10,
                        borderStyle: "round",
                    },
                }),
            ],
        }),
    );

    await run(
        "100vw as reference",
        termscape.create.box({
            style: {
                height: "100vh",
                width: 5,
                borderStyle: "round",
            },
        }),
    );

    await run(
        "creates only as many rows as needed, height = 5, stdout height = 20",
        termscape.create.box({
            style: {
                height: 5,
                width: 5,
                borderStyle: "round",
            },
        }),
    );

    await run(
        "creates only as many rows as needed, height = 10, stdout height = 20",
        termscape.create.box({
            style: {
                height: 10,
                width: 5,
                borderStyle: "round",
            },
        }),
    );
};
