import { type MouseEventType } from "../dom/MouseEvent.js";
import { type Data } from "term-keymap";
import { Emitter } from "./Stdin.js";
import EventEmitter from "events";
import { Ansi } from "../util/Ansi.js";
import { Root } from "../dom/Root.js";

type MouseData = Exclude<Data["mouse"], undefined>;
type Button = Extract<MouseEventType, "click" | "rightclick" | "scrollclick">;

const CURSOR_POS_REGEX = /\x1b\[(\d+);\d+R/;

const DblClickEmitter = new EventEmitter<Record<Button, [number, number]>>();

export class MouseState {
    private prev: MouseData | null;
    private root: Root;

    constructor(root: Root) {
        this.root = root;
        this.prev = null;
    }

    /**
     * Checks if the data being sent over is from a cursor position query and if
     * it is, resolves the Promise that sent the query.
     */
    private resolveCursorRow(utf: string) {
        const cursorPosition = utf.match(CURSOR_POS_REGEX)?.slice(1, 2).map(Number);

        if (cursorPosition) {
            const [y] = cursorPosition;
            Emitter.emit("CursorPosition", y - 1);
        }
    }

    /**
     * Processes mouse data and emits events
     */
    public process(data: Data, fullscreen: boolean = false) {
        this.resolveCursorRow(data.raw.utf);

        if (!data.mouse) return;

        const realX = data.mouse.x;
        const realY = data.mouse.y;

        if (fullscreen) {
            this.handleMouseEvent(data.mouse!, realX, realY);
            return;
        }

        return new Promise<number>((res, rej) => {
            const resolvePosition = (y: number) => {
                res(y);
                Emitter.off("CursorPosition", resolvePosition);
            };

            setTimeout(() => {
                Emitter.off("CursorPosition", resolvePosition);
                rej("Terminal does not support querying for cursor position");
            }, 10);

            Emitter.on("CursorPosition", resolvePosition);

            process.stdout.write(Ansi.queryCursorPosition);
        })
            .catch(() => {
                // I think silent failure is best here, but could eventually add
                // some sort of toggleable warning message
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

                const height = this.root.getLayoutHeight();
                const topRow = cursorRow - height + 1;
                const yoffset = topRow;

                const virtualX = realX;
                const virtualY = realY - yoffset;

                this.handleMouseEvent(data.mouse!, virtualX, virtualY);
            });
    }

    private handleMouseEvent(mouse: MouseData, x: number, y: number) {
        const dispatch = this.dispatchEvent(x, y);

        // SCROLL
        if (mouse.scrollUp) {
            dispatch("scrollup");
        }
        if (mouse.scrollDown) {
            dispatch("scrolldown");
        }

        // MOVEMENT
        if (mouse.mousemove) {
            dispatch("mousemove");
            if (mouse.leftBtnDown) {
                dispatch("dragstart");
            }
            if (mouse.releaseBtn && this.prev?.leftBtnDown) {
                dispatch("dragend");
            }
        }

        // BUTTON DOWN
        if (mouse.leftBtnDown) {
            dispatch("mousedown");
        }
        if (mouse.rightBtnDown) {
            dispatch("rightmousedown");
        }
        if (mouse.scrollBtnDown) {
            dispatch("scrollbtndown");
        }

        // CLICKS
        if (mouse.releaseBtn && this.prev) {
            if (this.prev.leftBtnDown) {
                handleRelease("click");
            }
            if (this.prev.rightBtnDown) {
                handleRelease("rightclick");
            }
            if (this.prev.scrollBtnDown) {
                handleRelease("scrollclick");
            }

            function handleRelease(type: Button): void {
                // Release Event
                if (type === "click") dispatch("mouseup");
                else if (type === "rightclick") dispatch("rightmouseup");
                else if (type === "scrollclick") dispatch("scrollbtnup");

                // Click Event
                dispatch(type);

                // If there is still a listener for this type, emit the double event.
                // Then create a listener with a timeout for the same event.
                DblClickEmitter.emit(type, x, y);
                listenForDbl(type);
            }

            function listenForDbl(event: Button): void {
                const handler = (nx: number, ny: number) => {
                    DblClickEmitter.off(event, handler);

                    // If mouse moves, the double click is considered invalid
                    if (nx !== x || ny !== y) return;

                    if (event === "click") dispatch("dblclick");
                    else if (event === "rightclick") dispatch("rightdblclick");
                    else if (event === "scrollclick") dispatch("scrolldblclick");
                };

                DblClickEmitter.on(event, handler);
                setTimeout(() => {
                    DblClickEmitter.off(event, handler);
                }, 500);
            }
        }

        this.prev = mouse;
    }

    private dispatchEvent = (x: number, y: number) => (event: MouseEventType) => {
        Emitter.emit("MouseEvent", x, y, event);
    };
}
