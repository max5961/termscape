import path from "node:path";
import fs from "node:fs";
import { TestRoot, type TestRuntime } from "./TestRoot.js";
import type { DomElement } from "../dom/DomElement.js";

// For test runners:
// createTestSuite (must be written in a test file in order to access vitest::test)
//
// For live
// createSnapshotType({ record: false | 'actual' | 'expected', mode: 'single' | 'frames' | 'live' }) =>
//     createSnapshot

export type RecordType = "actual" | "expected";
export type Snapshot = {
    record: false | RecordType;
    mode: "frames" | "live";
    replay: boolean;
    tester?: (name: string, actual: string, expected: string) => unknown;
};

export function configureSnapshot({ record, mode, replay, tester }: Snapshot) {
    return function createSuite(desc: string, runtime: TestRuntime) {
        const constrained = { ...runtime };

        constrained.mode = mode;
        constrained.writeStdout = false;

        if (mode === "frames") {
            // if single frame rendered and ops stack mt -> exit
            // if ops stack mt and single frame not yet rendered -> wait 100ms and exit
            // Once exited, 'TestRoot.playFrames()'
        }
        if (mode === "live") {
            // app exits when the real call stack is empty at the behest of the user
        }

        return async function runTest(
            name: string,
            app: DomElement,
            cb?: (root: TestRoot) => unknown,
        ) {
            const tname = record ? snapshotName(desc, name, record) : "";

            const root = new TestRoot(constrained);
            root.appendChild(app);
            cb?.(root);

            await root.waitUntilExit();
            if (record) {
                root.recordFrames(tname);
            }

            if (replay) {
                root.playFrames(`${desc} - ${name}`);
            }

            if (tester) {
                root.recordFrames(tname);
                const actual = getFile(desc, name, "actual");
                const expected = getFile(desc, name, "expected");
                // rmFile(desc, name, "actual");

                tester(name, actual, expected);
            }
        };
    };
}

function snapshotName(desc: string, name: string, type: RecordType) {
    const fmt = (s: string) => s.split(" ").join("-");
    return path.join(
        process.cwd(),
        `test/snapshots/${fmt(desc)}/${fmt(name)}.snapshot.${type}`,
    );
}

function getFile(...args: Parameters<typeof snapshotName>) {
    return fs.readFileSync(snapshotName(...args), "utf8");
}

function rmFile(...args: Parameters<typeof snapshotName>) {
    fs.rmSync(snapshotName(...args));
}
