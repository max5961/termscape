import ansi from "ansi-escape-sequences";
import { Canvas } from "./Canvas.js";

const ANSI_RESET = ansi.style.reset;

export type IGridToken = {
    ansi: string;
    char: string;
    charWidth: number;
};

export class GridTokens {
    private grid: Canvas["grid"];

    /**
     * {
     *    [y: number]: Set of X values for that particular row
     * }
     */
    private tokens: Map<number, Set<number>>;

    constructor(grid: Canvas["grid"]) {
        this.grid = grid;
        this.tokens = new Map();
    }

    /**
     * Convert just a specific section of a row in the 2d grid to a string.  Why
     * not just convert the entire grid into string cells?  That doesn't allow for
     * proper diffing.  For example, imagine we need to overwrite row `y` from columns
     * 5-10.  If an ansi style was applied in col 3 and spanned to col 12, then the
     * diff would have no way of knowing that 5-10 was supposed to be styled.  So,
     * redundant ansi styles must be removed just prior to writing, but before diffing.
     */
    public convertGridSegment(row: number, start?: number, end?: number): string {
        // copy so that the original grid is untouched and able to be diffed
        const segment = this.grid[row].slice(start ?? 0, end ? end + 1 : undefined);

        const operations = [] as { x: number; cell: string }[];
        const xValues = Array.from(this.tokens.get(row)?.values() ?? { length: 0 });

        xValues.forEach((x) => {
            const toIndex = x - (start ?? 0);

            const token = segment[toIndex] as IGridToken;
            const left = (segment[toIndex - 1] as IGridToken)?.ansi;
            const right = (segment[toIndex + 1] as IGridToken)?.ansi;

            // Left and right share same ansi - NO ANSI
            if (token.ansi === left && token.ansi === right) {
                operations.push({ x, cell: token.char });

                // Only right shares ansi - OPEN ANSI
            } else if (token.ansi !== left && token.ansi === right) {
                operations.push({ x, cell: token.ansi + token.char });

                // Only left shares ansi - CLOSE ANSI
            } else if (token.ansi === left && token.ansi !== right) {
                operations.push({ x, cell: token.char + ANSI_RESET });

                // Left and right share no ansi similarities - OPEN AND CLOSE ANSI
            } else {
                operations.push({
                    x,
                    cell: token.ansi + token.char + ANSI_RESET,
                });
            }
        });

        operations.forEach((op) => {
            segment[op.x] = op.cell;
        });

        return segment.join("");
    }

    public pushToken(x: number, y: number): void {
        if (!this.tokens.has(y)) {
            this.tokens.set(y, new Set([x]));
        } else {
            this.tokens.get(y)!.add(x);
        }
    }

    public removeToken(x: number, y: number): void {
        if (this.tokens.has(y)) {
            this.tokens.get(y)!.delete(x);
        }
    }
}
