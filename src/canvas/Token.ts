import ansiApply from "ansi-escape-sequences";
import { Canvas } from "./Canvas.js";

export const AnsiApply = {
    /** Do not apply the ansi if it exists */
    none: 0,
    /** Prepend the ansi style */
    open: 1,
    /** Append `ansi.reset` */
    close: 2,
    /** Prepend the ansi style *and* append `ansi.reset` */
    both: 3,
    /** Write an empty string to the cell */
    prune: 4,
} as const;

type _AnsiApply = (typeof AnsiApply)[keyof typeof AnsiApply];

export type GridToken = {
    ansi: string;
    char: string;
    /** @param type
     * - If `start`, prepend the ansi.
     * - If `end` append `ansi.reset`
     * - If `middle` place the char as is.
     * - If `start, end`, prepend the ansi and append ansi.reset.
     * */
    place: (type: (typeof AnsiApply)[keyof typeof AnsiApply]) => void;
};

export const createToken =
    (canvas: Canvas) =>
    (ansi: string, char: string) =>
    (x: number, y: number): GridToken => {
        return {
            ansi,
            char,
            place(style: _AnsiApply) {
                if (style === AnsiApply.open) {
                    this.char = this.ansi + this.char;
                }
                if (style === AnsiApply.close) {
                    this.char = this.char + ansiApply.style.reset;
                }
                if (style === AnsiApply.both) {
                    this.char = this.ansi + this.char + ansiApply.style.reset;
                }
                if (style === AnsiApply.prune) {
                    this.char = "";
                }

                if (canvas.grid[y]?.[x]) {
                    canvas.grid[y][x] = this.char;
                }
            },
        };
    };
