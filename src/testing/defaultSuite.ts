import { configureSnapshot, type RecordType } from "./configureSnapshot.js";

export const DEFAULT_TEST_RUNTIME = {
    rows: 20,
    columns: 80,
    altScreen: false,
};

export const defaultSuite = (record: false | RecordType) => (desc: string) => {
    return configureSnapshot({
        record,
        replay: "interactive",
    })(desc, { ...DEFAULT_TEST_RUNTIME });
};
