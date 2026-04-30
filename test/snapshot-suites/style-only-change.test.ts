import termscape from "@src/index.js";
import { describe } from "vitest";
import { defaultTestSuite } from "./util/defaultTestSuite.js";

const SUITE = "style only change";
const run = defaultTestSuite(SUITE);

describe(SUITE, async () => {
    await run(
        "only style change does not clip if prev grid was had trimmed ws",
        (root) => {
            const list = termscape.create.list({
                style: {
                    height: 5,
                    width: "100vw",
                    flexDirection: "column",
                },
                children: Array.from({ length: 5 }).map((_, idx) => {
                    return termscape.create.box({
                        style: ({ focus }) => {
                            return {
                                height: 1,
                                width: "100",
                                backgroundColor: focus ? "blue" : undefined,
                                justifyContent: "center",
                            };
                        },
                        children: [termscape.create.text({ textContent: String(idx) })],
                    });
                }),
            });

            list.addKeyListener("j", () => list.focusNext());

            root.sendOps(["j", "j", "j", "j"]);

            return list;
        },
    );
});
