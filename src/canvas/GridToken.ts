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

    public convertTokens() {
        const operations = [] as { x: number; y: number; cell: string }[];

        const rows = Array.from(this.tokens.entries());
        rows.forEach(([y, set]) => {
            const xValues = Array.from(set.values());

            xValues.forEach((x) => {
                const token = this.grid[y][x] as IGridToken;
                const left = (this.grid[y][x - 1] as IGridToken)?.ansi;
                const right = (this.grid[y][x + 1] as IGridToken)?.ansi;

                // Left and right share same ansi - NO ANSI
                if (token.ansi === left && token.ansi === right) {
                    operations.push({ x, y, cell: token.char });

                    // Only right shares ansi - OPEN ANSI
                } else if (token.ansi !== left && token.ansi === right) {
                    operations.push({ x, y, cell: token.ansi + token.char });

                    // Only left shares ansi - CLOSE ANSI
                } else if (token.ansi === left && token.ansi !== right) {
                    operations.push({ x, y, cell: token.char + ANSI_RESET });

                    // Left and right share no ansi similarities - OPEN AND CLOSE ANSI
                } else {
                    operations.push({ x, y, cell: token.ansi + token.char + ANSI_RESET });
                }
            });
        });

        operations.forEach((op) => {
            this.grid[op.y][op.x] = op.cell;
        });

        return this.grid as string[][];
    }

    /**
     * Convert just a specific segment.  This is necessary for precision re-renders
     * since if we diff a segment that has already opened an ansi style but yet
     * to close, then those styles won't be applied in the `process.stdout.write`
     * operation. Rather than convert the entire grid, convert just a segment of it.
     */
    public convertSegment(y: number, segment: (string | IGridToken)[]) {
        const operations = [] as { x: number; cell: string }[];
        const xValues = Array.from(this.tokens.get(y)?.values() ?? { length: 0 });

        xValues.forEach((x) => {
            const token = segment[x] as IGridToken;
            const left = (segment[x - 1] as IGridToken)?.ansi;
            const right = (segment[x + 1] as IGridToken)?.ansi;

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
