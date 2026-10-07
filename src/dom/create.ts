import { CoreRootElement, type RuntimeSetup } from "../core/CoreRootElement.js";
import { CoreTestRootElement } from "../test-utils/CoreTestRoot.js";
import { TestRootElement } from "../test-utils/TestRootElement.js";
import { BoxElement } from "./BoxElement.js";
import { RootElement } from "./RootElement.js";

// typescript doesn't allow stripInternal on object literals, so the singleton
// route was necessary here

class Create {
    root = (setup?: RuntimeSetup) => {
        return new RootElement((shell) => {
            return new CoreRootElement(shell, setup ?? {});
        });
    };

    /** @internal for snapshot testing */
    testRoot = (setup?: RuntimeSetup) => {
        return new TestRootElement((shell) => {
            return new CoreTestRootElement(shell, setup ?? {}, { rows: 10, columns: 20 });
        });
    };

    box = () => {
        return new BoxElement();
    };
}

export const create = new Create();
