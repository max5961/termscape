import { Root } from "./dom/Root.js";
import { Document } from "./dom/Document.js";

const root = new Root({ debounceMs: 64 });

root.renderer.postLayoutHook((canvas) => {
    const pen = canvas.getPen();
    pen.moveTo(2, 2);
    const word = "watermark";
    for (let i = 0; i < word.length; ++i) {
        pen.draw(`\x1b[33m${word[i]}\x1b[0m`, "R", 1);
    }
});

const c1 = Document.createElement("BOX_ELEMENT");

c1.style.height = 10;
c1.style.width = 20;
c1.style.borderStyle = "round";
c1.style.backgroundColor = "yellow";

const c1c1 = Document.createElement("BOX_ELEMENT");
c1c1.style.height = "50";
c1c1.style.width = "50";
c1c1.style.borderStyle = "round";
c1c1.style.zIndex = 5;

c1.appendChild(c1c1);

// const c2c2 = Document.createElement("BOX_ELEMENT");
// c2c2.style.height = "50";
// c2c2.style.width = "50";
// c2c2.style.borderStyle = "round";
// c2c2.style.zIndex = 5;
// c1.appendChild(c2c2);

root.appendChild(c1);

// setTimeout(() => {
//     c1.style.height = 10;
// }, 100);

// c1.node.setMeasureFunc((a, b, c, d) => {
//     //
// });

let width = 1;

const id = setInterval(() => {
    if (++width > process.stdout.columns) clearInterval(id);
    c1.style.width = width;
}, 5);
