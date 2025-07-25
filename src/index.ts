import { Document } from "./dom/Document.js";
import { root } from "./dom/Root.js";

root.configure({ debounceMs: 16 });

root.hooks.postLayout((canvas) => {
    const pen = canvas.getPen();
    pen.moveTo(2, 2);
    const word = "watermark";
    for (let i = 0; i < word.length; ++i) {
        pen.draw(`\x1b[33m${word[i]}\x1b[0m`, "R", 1);
    }
});

root.hooks.renderPerf((data) => {
    // console.log(data);
});

const c1 = Document.createElement("BOX_ELEMENT");

c1.style.height = 50;
c1.style.width = 20;
c1.style.borderStyle = "round";
c1.style.backgroundColor = "magenta";

const c1c1 = Document.createElement("BOX_ELEMENT");
c1c1.style.height = "50";
c1c1.style.width = "50";
c1c1.style.borderStyle = "round";
c1c1.style.zIndex = 5;
c1c1.style.backgroundColor = "brightMagenta";

c1.appendChild(c1c1);

// const c2c2 = Document.createElement("BOX_ELEMENT");
// c2c2.style.height = "50";
// c2c2.style.width = "50";
// c2c2.style.borderStyle = "round";
// c2c2.style.zIndex = 5;
// c1.appendChild(c2c2);

root.appendChild(c1);

let width = 1;
let forward = true;
const id = setInterval(() => {
    if (forward) {
        if (width + 1 < process.stdout.columns) {
            ++width;
        } else {
            forward = false;
        }
    }

    if (!forward) {
        if (width - 1 >= 0) {
            --width;
        } else {
            forward = true;
        }
    }
    c1.style.width = width;
}, 2);
