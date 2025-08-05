import { Root } from "./dom/Root.js";

const root = new Root({ debounceMs: 16, altScreen: true });

const child1 = root.createElement("BOX_ELEMENT")!;

child1.style.height = 10;
child1.style.width = 10;
child1.style.backgroundColor = "cyan";
child1.style.borderStyle = "round";

root.appendChild(child1);
root.scheduleRender({ resize: false });

const callback = () => {
    const color = child1.style.backgroundColor;
    child1.style.backgroundColor = color === "cyan" ? "green" : "cyan";
    root.scheduleRender({ resize: false });
};
root.addKeyListener({ keymap: "<A-j>", callback });
root.addKeyListener({ keymap: "<A-k>", callback });
root.addKeyListener({
    keymap: "<A-l>",
    callback: () => {
        let width = Number(child1.style.width ?? 0);
        if (width < process.stdout.columns) {
            child1.style.width = ++width;
        }
        root.scheduleRender({ resize: false });
    },
});
root.addKeyListener({
    keymap: "<A-h>",
    callback: () => {
        let width = Number(child1.style.width ?? 0);
        if (width > 0) {
            child1.style.width = --width;
        }
        root.scheduleRender({ resize: false });
    },
});
