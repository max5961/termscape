import { Ansi } from "../Ansi.js";
import type { Grid, GridToken } from "../canvas/types.js";

export class GridConverter {
    public static stringifyRowSegment(
        grid: Readonly<Grid>,
        y: number,
        start?: number,
        end?: number,
    ) {
        const row = grid[y];
        if (!row) return "";

        start ??= 0;
        end ??= row.length;

        const length = end - start;
        const result = new Array(length + 1);
        result[0] = Ansi.reset;

        for (let i = 0; i < length; ++i) {
            const token = row[i + start];

            // prettier-ignore
            const leftAnsi = 
                i === 0 ? "" : (row[i + start - 1] as GridToken)?.ansi;
            // prettier-ignore
            const rightAnsi =
                i === length - 1 ? "" : (row[i + start + 1] as GridToken)?.ansi;

            result[i + 1] = this.convertToken(token, leftAnsi, rightAnsi);
        }

        return result.join("") + Ansi.reset;
    }

    public static stringifyRow(grid: Readonly<Grid>, y: number) {
        return this.stringifyRowSegment(grid, y);
    }

    public static stringifyGrid(grid: Readonly<Grid>): {
        newLines: number;
        output: string;
    } {
        let newLines = 0;
        const output = grid
            .map((_row, y) => {
                const nl = y === grid.length - 1 ? "" : "\n";
                if (nl) ++newLines;

                // prettier-ignore
                return this
                    .stringifyRow(grid, y)
                    .trimEnd() + nl;
            })
            .join("");

        return { newLines, output };
    }

    private static convertToken(
        token: string | GridToken,
        leftAnsi: string,
        rightAnsi: string,
    ) {
        if (typeof token === "string") return token;

        // Left and right share same ansi - NO ANSI
        if (token.ansi === leftAnsi && token.ansi === rightAnsi) {
            return token.char;

            // Only right shares ansi - OPEN ANSI
        } else if (token.ansi !== leftAnsi && token.ansi === rightAnsi) {
            return token.ansi + token.char;

            // Only left shares ansi - CLOSE ANSI
        } else if (token.ansi === leftAnsi && token.ansi !== rightAnsi) {
            return token.char + Ansi.reset;

            // Left and right share no ansi similarities - OPEN AND CLOSE ANSI
        } else {
            return token.ansi + token.char + Ansi.reset;
        }
    }
}
