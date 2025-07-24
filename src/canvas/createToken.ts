import ansiApply from "ansi-escape-sequences";
import { Canvas } from "./Canvas.js";
import { IGridToken } from "./GridToken.js";

/** All of this should be in the Renderer.Write class */

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

const ANSI_RESET = ansiApply.style.reset;

type _AnsiApply = (typeof AnsiApply)[keyof typeof AnsiApply];

export function placeToken(
    x: number,
    y: number,
    grid: Canvas["grid"],
    token: IGridToken,
    style: _AnsiApply,
) {
    let contents: string;
    if (style === AnsiApply.none) {
        contents = token.char;
    } else if (style === AnsiApply.open) {
        contents = token.ansi + token.char;
    } else if (style === AnsiApply.close) {
        contents = token.char + ANSI_RESET;
    } else if (style === AnsiApply.both) {
        contents = token.ansi + token.char + ANSI_RESET;
    } else {
        contents = "";
    }

    grid[y][x] = contents;
}
