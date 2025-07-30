import { EventEmitter } from "node:events";
import { configureStdin, ActionStore, InputState } from "term-keymap";
import { root } from "../dom/Root.js";
import { MouseEvent } from "../dom/MouseEvent.js";

configureStdin({
    stdout: process.stdout,
    mouseMode: 3,
    enableMouse: true,
    enableKittyProtocol: true,
});

const store = new ActionStore();
const inputState = new InputState();

store.subscribe({
    name: "quit",
    keymap: "<C-c>",
    callback: () => process.exit(),
});

export const Emitter = new EventEmitter<{
    eventOccured: [x: number, y: number, type: MouseEvent];
    cursorPosition: [y: number];
}>();

process.stdin.on("data", (buf: Buffer) => {
    const { data } = inputState.process(buf, store.getActions());

    const cursorPosition = data.raw.utf
        .match(/\x1b\[(\d+);\d+R/)
        ?.slice(1, 2)
        .map(Number);
    if (cursorPosition) {
        const [y] = cursorPosition;
        Emitter.emit("cursorPosition", y - 1);
    }

    if (data.mouse) {
        const {
            leftBtnDown,
            rightBtnDown,
            scrollUp,
            scrollDown,
            releaseBtn,
            scrollBtnDown,
            mousemove,
            x,
            y,
        } = data.mouse;

        if (mousemove || !leftBtnDown) return;

        new Promise<number>((res, rej) => {
            process.stdout.write("\x1b[6n");

            const resolvePosition = (y: number) => {
                res(y);
                Emitter.off("cursorPosition", resolvePosition);
            };

            setTimeout(() => {
                Emitter.off("cursorPosition", resolvePosition);
                rej("Could not query cursor position");
            }, 10);

            Emitter.on("cursorPosition", resolvePosition);
        })
            .catch((err) => {
                // Term does not support querying for mouse position
            })
            .then((cursorRow) => {
                if (cursorRow === undefined) return;

                /**
                 * In order to accomodate layouts that aren't fullscreen, the yoffset
                 * must be calculated.  The cursor position is always on the last
                 * row of the last output, and this means the top row can be calculated.
                 *
                 * `virtualY` is the y-value with applied offset that is meaningful
                 * to the layout calculated by Yoga.
                 */

                const height = root.getLayoutHeight();
                const topRow = cursorRow - height + 1;
                const yoffset = topRow;

                const virtualX = x;
                const virtualY = y - yoffset;

                console.log({
                    virtualX,
                    virtualY,
                    topRow,
                    cursorRow,
                });

                Emitter.emit("eventOccured", virtualX, virtualY, "MouseDown");
            });
    }
});
