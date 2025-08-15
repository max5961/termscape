import { createElement } from "./dom/elements/createElement.js";
import type { Color } from "./types.js";

const root = createElement("root", {
    debounceMs: 16,
    // altScreen: true,
    exitOnCtrlC: true,
    exitForcesEndProc: true,
    enableMouse: true,
});

root.run().then(() => {
    console.log("We are done");
});

const child1 = createElement("box");

child1.style.height = "100vh";
child1.style.width = "100vw";

child1.style = {
    alignItems: "center",
    justifyContent: "center",
    columnGap: 2,
    height: 25,
    width: 25,
    // backgroundColor: "green",
    // borderStyle: "round",
};

root.appendChild(child1);

const child2 = createElement("box");
child2.style.height = "25";
child2.style.width = "25";
child2.style.backgroundColor = "red";
child2.style.borderStyle = "round";

const child3 = createElement("box");
child3.style.height = "25";
child3.style.width = "25";
child3.style.backgroundColor = "cyan";
child3.style.borderStyle = "round";

child1.appendChild(child2);
child1.appendChild(child3);

child1.addKeyListener({
    keymap: "<A-j>",
    callback: () => {
        let height = Number(child1.style.height ?? 0);
        if (height < process.stdout.rows) {
            child1.style.height = ++height;
        }
    },
});

child1.addKeyListener({
    keymap: "<A-k>",
    callback: () => {
        let height = Number(child1.style.height ?? 0);
        if (height > 0) {
            child1.style.height = --height;
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
