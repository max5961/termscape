import { TestRoot, type TestRuntime } from "./TestRoot.js";
import type { DomElement } from "../dom/DomElement.js";
import * as TestUtil from "./util.js";

export type RecordType = "actual" | "expected";
export type Snapshot = {
    record: false | RecordType;
    replay: false | "auto" | "interactive";
    tester?: (name: string, actual: string, expected: string) => unknown;
};

export function configureSnapshot({ record, replay, tester }: Snapshot) {
    return function createSuite(desc: string, runtime: TestRuntime) {
        return async function runTest(
            name: string,
            app: DomElement | ((root: TestRoot) => DomElement),
        ) {
            const root = new TestRoot(runtime);
            const firstChild = typeof app === "function" ? app(root) : app;
            root.appendChild(firstChild);

            await root.waitUntilExit();

            if (record) {
                root.recordFrames(TestUtil.snapshotName(desc, name, record));
            }

            // This exists in the event tests are failing, but when under inspection, they should be passing.  The drawback is
            // using this env var overwrites all tests so it should be used very cautiously and only in situations where most or
            // all tests are affected due to some rendering change that changes the output string but not the visual output.
            if (tester && process.env.OVERWRITE_SNAPSHOTS === "true") {
                root.recordFrames(TestUtil.snapshotName(desc, name, "expected"));
            }

            const dName = TestUtil.getDisplayName(desc, name);
            if (replay === "auto") {
                await root.replayAuto(dName);
            } else if (replay === "interactive") {
                await root.replayInteractive("n", dName);
            }

            if (tester) {
                root.recordFrames(TestUtil.snapshotName(desc, name, "actual"));
                const actual = TestUtil.getFile(desc, name, "actual");
                const expected = TestUtil.getFile(desc, name, "expected");

                tester(name, actual, expected);
            }
        };
    };
}
