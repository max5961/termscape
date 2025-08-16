import { createElement } from "./dom/elements/createElement.js";
import { logger } from "./logger/Logger.js";
import type { Color } from "./types.js";

const root = createElement("root", {
    debounceMs: 16,
    altScreen: true,
    exitOnCtrlC: true,
    exitForcesEndProc: false,
    enableMouse: false,
    preciseWrite: true,
    startOnCreate: true,
});

root.waitUntilExit().then(() => {
    console.log("The app is done");
});

const child1 = createElement("box");

child1.style = {
    height: 10,
    width: 25,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    backgroundColor: "green",
    borderStyle: "round",
    overflow: "hidden",
};

root.appendChild(child1);

const child2 = createElement("box");
child2.style.height = 15;
child2.style.width = 15;
child2.style.backgroundColor = "red";
child2.style.borderStyle = "round";
child2.style.flexShrink = 0;

child1.appendChild(child2);

child1.addKeyListener({
    keymap: "<A-j>",
    callback: () => {
        let height = Number(child1.style.height ?? 0);
        if (height < process.stdout.rows) {
            child1.style.height = ++height;
            // console.log(height);
        }
    },
});
child1.addKeyListener({
    keymap: "<A-k>",
    callback: () => {
        let height = Number(child1.style.height ?? 0);
        if (height > 0) {
            child1.style.height = --height;
            // console.log(height);
        }
    },
});
child1.addKeyListener({
    keymap: "<A-l>",
    callback: () => {
        let width = Number(child1.style.width ?? 0);
        if (width < process.stdout.columns) {
            child1.style.width = ++width;
            // console.log(width);
        }
    },
});
child1.addKeyListener({
    keymap: "<A-h>",
    callback: () => {
        let width = Number(child1.style.width ?? 0);
        if (width > 0) {
            child1.style.width = --width;
            // console.log(width);
        }
    },
});
