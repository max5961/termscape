import { createElement } from "./shared/CreateElement.js";

const termscape = { createElement };

const root = termscape.createElement("root", {
    debounceMs: 16,
    exitOnCtrlC: true,
    exitForcesEndProc: false,
    enableMouse: true,
    altScreen: false,
    preciseWrite: false,
    startOnCreate: true,
});

root.waitUntilExit().then(() => {
    console.log("The app is done");
});

const box = termscape.createElement("box");
box.style = {
    width: 5,
    height: 5,
    borderStyle: "round",
    overflow: "hidden",
};

const text = termscape.createElement("text");

text.textContent =
    "The moment hit like thunder, too loud to ignore and too sharp to forget.";

text.style = {
    color: "red",
    align: "center",
};

box.appendChild(text);
root.appendChild(box);

box.addKeyListener({
    keymap: "<A-h>",
    callback() {
        if (typeof box.style.width === "number") {
            --box.style.width;
        }
    },
});
box.addKeyListener({
    keymap: "<A-l>",
    callback() {
        if (typeof box.style.width === "number") {
            ++box.style.width;
        }
    },
});
box.addKeyListener({
    keymap: "<A-j>",
    callback() {
        if (typeof box.style.height === "number") {
            --box.style.height;
        }
    },
});
box.addKeyListener({
    keymap: "<A-k>",
    callback() {
        if (typeof box.style.height === "number") {
            ++box.style.height;
        }
    },
});
