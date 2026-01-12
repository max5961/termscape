import termscape from "@src/index.js";
import { defaultTestSuite } from "./util/defaultTestSuite.js";
import type { TestRoot } from "@src/testing/TestRoot.js";
import { DEFAULT_TEST_RUNTIME } from "@src/testing/defaultSuite.js";

const SUITE = "viewport dimensions";
const run = defaultTestSuite(SUITE);

export const record = async () => {
    await run("100 height/width", (root) => {
        const box = getBox("100", "100");
        root.sendOps(ops(root));
        return box;
    });
    await run("75 height/width", (root) => {
        const box = getBox("75", "75");
        root.sendOps(ops(root));
        return box;
    });
    await run("100 min height/width", (root) => {
        const box = getMinDimBox("100", "100");
        root.sendOps(ops(root));
        return box;
    });
    await run("75 min height/width", (root) => {
        const box = getMinDimBox("75", "75");
        root.sendOps(ops(root));
        return box;
    });
};

function getBox(h: string, w: string) {
    return termscape.createElement("box", {
        style: {
            height: h + "vh",
            width: w + "vw",
            borderStyle: "round",
        },
    });
}

function getMinDimBox(h: string, w: string) {
    return termscape.createElement("box", {
        style: {
            minHeight: h + "vh",
            minWidth: w + "vw",
            borderStyle: "round",
        },
    });
}

function ops(root: TestRoot) {
    return [
        () =>
            root.dispatchResizeEvent("set", {
                rows: 5,
                columns: 10,
            }),
        () => {
            root.dispatchResizeEvent("set", {
                ...DEFAULT_TEST_RUNTIME,
            });
        },
    ];
}
