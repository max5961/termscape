import termscape from "@src/index.js";
import { defaultTestSuite } from "./util/defaultTestSuite.js";
import { describe } from "vitest";

const SUITE = "optimize scrolling post resize";
const run = defaultTestSuite(SUITE);

describe(SUITE, async () => {
    await run("rows resize larger at end", (root) => {
        const s = getScrollable("column");
        s.afterLayout({
            subscribe: false,
            handler: () => {
                s.scrollDown(Infinity);
                return true;
            },
        });

        root.sendOps([
            () =>
                root.dispatchResizeEvent("offset", {
                    rows: 10,
                    columns: 0,
                }),
        ]);

        return s;
    });

    await run("columns resize larger at end", (root) => {
        const s = getScrollable("row");
        s.afterLayout({
            subscribe: false,
            handler: () => {
                s.scrollRight(Infinity);
                return true;
            },
        });

        root.sendOps([
            () =>
                root.dispatchResizeEvent("offset", {
                    rows: 0,
                    columns: 10,
                }),
        ]);

        return s;
    });
});

function getScrollable(flex: "column" | "row") {
    return termscape.create.box({
        style: {
            height: "100vh",
            width: "100vw",
            overflow: "scroll",
            borderStyle: "round",
            flexDirection: flex,
        },
        children: Array.from({ length: 1000 }).map((_, idx) => {
            return termscape.create.box({
                style: {
                    flexShrink: 0,
                },
                children: [
                    termscape.create.text({
                        textContent: ` ${String(idx)} `,
                    }),
                ],
            });
        }),
    });
}
