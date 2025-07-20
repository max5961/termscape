import Yoga from "yoga-wasm-web/auto";
import { Document } from "./dom/Document.js";

export { logger } from "./logger.js";
export { Logger } from "./logger/Logger.js";
export { type Color } from "./util/types.js";
export { Document } from "./dom/Document.js";

const foo = Document.createElement("BOX_ELEMENT");
// These need to be a setters
foo.style.height = 10;
foo.style.width = 10;
foo.style.display = "flex";

Document.Body.style.display = "flex";
Document.Body.appendChild(foo);

Document.Body.node.calculateLayout(process.stdout.columns, undefined, Yoga.DIRECTION_LTR);

console.log({
    document: {
        height: Document.Body.node.getComputedHeight(),
        width: Document.Body.node.getComputedWidth(),
    },
    foo: {
        height: Document.Body.children[0].node.getComputedHeight(),
        width: Document.Body.children[0].node.getComputedWidth(),
    },
});
