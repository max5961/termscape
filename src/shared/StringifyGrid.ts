import type { GridToken } from "../Types.js";
import type { Grid } from "../compositor/Canvas.js";
import { Ansi } from "./Ansi.js";

export function stringifyRowSegment(
    grid: Grid,
    y: number,
    start?: number,
    end?: number,
): string {
    const row = grid[y];
    if (!row) return "";

    start ??= 0;
    end ??= row.length;

    const length = end - start;
    const result = new Array(length + 1);
    result[0] = Ansi.style.reset;

    for (let i = 0; i < length; ++i) {
        const token = row[i + start];

        // prettier-ignore
        const leftAnsi = 
                i === 0 ? "" : (row[i + start - 1] as GridToken)?.ansi;
        // prettier-ignore
        const rightAnsi =
                i === length - 1 ? "" : (row[i + start + 1] as GridToken)?.ansi;

        result[i + 1] = convertToken(token, leftAnsi, rightAnsi);
    }

    return result.join("") + Ansi.style.reset;
}

function convertToken(token: string | GridToken, leftAnsi: string, rightAnsi: string) {
    if (typeof token === "string") return token;

    // Left and right share same ansi - NO ANSI
    if (token.ansi === leftAnsi && token.ansi === rightAnsi) {
        return token.char;

        // Only right shares ansi - OPEN ANSI
    } else if (token.ansi !== leftAnsi && token.ansi === rightAnsi) {
        return token.ansi + token.char;

        // Only left shares ansi - CLOSE ANSI
    } else if (token.ansi === leftAnsi && token.ansi !== rightAnsi) {
        return token.char + Ansi.style.reset;

        // Left and right share no ansi similarities - OPEN AND CLOSE ANSI
    } else {
        return token.ansi + token.char + Ansi.style.reset;
    }
}
