import { configureSnapshot, type Snapshot } from "@src/testing/configureSnapshot.js";
import { expect, test } from "vitest";

test("createSuite expect true to be true", () => expect(true).toBe(true));

function tester(...[name, actual, expected]: Parameters<Required<Snapshot>["tester"]>) {
    test(name, () => {
        expect(actual === expected).toBe(true);
    });
}

export const defaultSuite = (name: string) => {
    return configureSnapshot({
        record: "actual",
        mode: "frames",
        replay: false,
        tester,
    })(name, {
        rows: 20,
        columns: 80,
        mode: "frames",
        writeStdout: false,
        maxFrames: Infinity,
    });
};

export const createSuite = configureSnapshot({
    record: "actual",
    mode: "frames",
    replay: false,
    tester,
});
