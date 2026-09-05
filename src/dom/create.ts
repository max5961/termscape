import type { RuntimeSetup } from "../core/CoreRootElement.js";
import { BoxElement } from "./BoxElement.js";
import { RootElement } from "./RootElement.js";

export const create = {
    root: (setup?: RuntimeSetup) => {
        return new RootElement(setup ?? {});
    },
    box: () => {
        return new BoxElement();
    },
};
