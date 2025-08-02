import { Document } from "./dom/Document.js";
import { DomElement } from "./dom/DomElement.js";
import { BoxElement } from "./dom/elements/BoxElement.js";
import { root } from "./dom/Root.js";
import { Color } from "./types.js";

root.configure({ debounceMs: 16 });

// root.hooks.postLayout((canvas) => {
//     const word = "watermark";
//     const pen = canvas.getPen();
//     pen.moveTo(2, 2);
//     pen.set.color("red");
//     for (let i = 0; i < word.length; ++i) {
//         pen.draw(word[i], "R", 1);
//     }
// });
//
// root.hooks.renderPerf((data) => {
//     // console.log(data);
// });

const c1 = Document.createElement("BOX_ELEMENT");

c1.style.height = 10;
c1.style.width = 20;
c1.style.borderStyle = "round";
c1.style.backgroundColor = "magenta";

c1.addEventListener("MouseDown", (e) => {
    console.log("c1 LOL");
});

const c1c1 = Document.createElement("BOX_ELEMENT");
c1c1.style.height = "50";
c1c1.style.width = "50";
c1c1.style.borderStyle = "round";
c1c1.style.zIndex = 0;
c1c1.style.backgroundColor = "yellow";

const colors: Color[] = ["red", "yellow", "blue", "cyan", "magenta"];
c1c1.addEventListener("MouseDown", function (this: BoxElement, e) {
    this.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    e.stopImmediatePropagation();
});
c1c1.addEventListener("MouseDown", () => {
    console.log("c1c1 LOL");
});

c1.appendChild(c1c1);

root.appendChild(c1);
