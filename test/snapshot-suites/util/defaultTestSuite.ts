import { configureSnapshot, type Snapshot } from "@src/testing/configureSnapshot.js";
import { DEFAULT_TEST_RUNTIME } from "@src/testing/defaultSuite.js";
import { expect, test } from "vitest";

test("createSuite expect true to be true", () => expect(true).toBe(true));

function tester(...[name, actual, expected]: Parameters<Required<Snapshot>["tester"]>) {
    test(name, () => {
        expect(actual === expected).toBe(true);
    });
}

export const defaultTestSuite = (name: string) => {
    return configureSnapshot({
        record: "actual",
        replay: false,
        tester,
    })(name, {
        ...DEFAULT_TEST_RUNTIME,
    });
};
