import { Root } from "./dom/Root.js";

const root = new Root({ debounceMs: 16, altScreen: true });

const child1 = root.createElement("BOX_ELEMENT");

child1!.style.height = 10;
child1!.style.width = 10;
child1!.style.backgroundColor = "cyan";
child1!.style.borderStyle = "round";

root.appendChild(child1!);
root.scheduleRender({ resize: false });
