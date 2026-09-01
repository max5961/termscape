import { BoxElement } from "./BoxElement.js";
import { RootElement } from "./RootElement.js";
import type { RuntimeSetup } from "../core/runtime/Runtime.js";

export const create = {
    root: (setup?: RuntimeSetup) => {
        return new RootElement(setup ?? {});
    },
    box: () => {
        return new BoxElement();
    },
};
