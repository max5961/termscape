import { Root } from "./dom/Root.js";
import { Document } from "./dom/Document.js";

const root = new Root({ debounceMs: 16 });

const child1 = Document.createElement("BOX_ELEMENT");

child1.style.height = 10;
child1.style.width = 20;
child1.style.borderStyle = "round";

const child1child1 = Document.createElement("BOX_ELEMENT");
child1child1.style.height = "50";
child1child1.style.width = "50";
child1child1.style.borderStyle = "round";

child1.appendChild(child1child1);

root.appendChild(child1);

let width = 1;

const id = setInterval(() => {
    if (++width > process.stdout.columns) --width;
    child1.style.width = width;
}, 10);

setTimeout(() => {
    clearInterval(id);
}, 10000);
