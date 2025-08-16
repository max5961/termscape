import { createElement } from "./dom/elements/createElement.js";
import type { Color } from "./types.js";

const root = createElement("root", {
    debounceMs: 16,
    altScreen: false,
    exitOnCtrlC: true,
    exitForcesEndProc: false,
    enableMouse: true,
    preciseWrite: true,
    startOnCreate: false,
});

async function runApp() {
    await root.waitUntilExit();
    console.log("The app is done");
}
runApp();

console.log("LMFAOOOO");
setTimeout(() => {
    root.startRuntime();
}, 1000);

const child1 = createElement("box");

child1.style = {
    height: 10,
    width: 25,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    backgroundColor: "green",
    borderStyle: "round",
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
child3.addEventListener("click", () => {
    console.log("click child3");
});

child1.appendChild(child2);
child1.appendChild(child3);

child1.addKeyListener({
    keymap: "<A-j>",
    callback: () => {
        let height = Number(child1.style.height ?? 0);
        if (height < process.stdout.rows) {
            child1.style.height = ++height;
            console.log(height);
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
