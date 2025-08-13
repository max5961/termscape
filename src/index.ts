import { createElement } from "./dom/elements/createElement.js";
import { throwError } from "./error/throwError.js";

const root = createElement("root", {
    debounceMs: 16,
    // altScreen: false,
    altScreen: true,
    exitOnCtrlC: true,
    enableMouse: true,
});
const child1 = createElement("box");

child1.style.height = 10;
child1.style.width = 10;
child1.style.backgroundColor = "cyan";
child1.style.borderStyle = "round";

const child2 = createElement("box");

child1.addKeyListener({
    keymap: "<A-j>",
    callback: () => {
        let height = Number(child1.style.height ?? 0);
        if (height < process.stdout.rows) {
            child1.style.height = ++height;
        }
        root.insertBefore(child2, child1);
    },
});

child1.addKeyListener({
    keymap: "<A-k>",
    callback: () => {
        let height = Number(child1.style.height ?? 0);
        if (height > 0) {
            child1.style.height = --height;
            throwError(null, "LMFAOOOOO");
        }
    },
});

child1.addKeyListener({
    keymap: "<A-l>",
    callback: () => {
        let width = Number(child1.style.width ?? 0);
        if (width < process.stdout.columns) {
            child1.style.width = ++width;
        }
    },
});
child1.addKeyListener({
    keymap: "<A-h>",
    callback: () => {
        let width = Number(child1.style.width ?? 0);
        if (width > 0) {
            child1.style.width = --width;
        }
    },
});

root.appendChild(child1);
root.run().then(() => {
    console.log("We are done");
});

// child1.addKeyListener({
//     keymap: "<A-k>",
//     callback: () => {
//         let height = Number(child1.style.height ?? 0);
//         if (height > 0) {
//             child1.style.height = --height;
//         }
//     },
// });
//
// child1.addKeyListener({
//     keymap: "<A-l>",
//     callback: () => {
//         let width = Number(child1.style.width ?? 0);
//         if (width < process.stdout.columns) {
//             child1.style.width = ++width;
//         }
//     },
// });
// child1.addKeyListener({
//     keymap: "<A-h>",
//     callback: () => {
//         let width = Number(child1.style.width ?? 0);
//         if (width > 0) {
//             child1.style.width = --width;
//         }
//     },
// });
//
// root.appendChild(child1);
