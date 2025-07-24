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
        const operations = [] as { x: number; y: number; char: string }[];

        const rows = Array.from(this.tokens.entries());
        rows.forEach(([y, set]) => {
            const xValues = Array.from(set.values());

            xValues.forEach((x) => {
                const token = this.grid[y][x] as IGridToken;
                const left = (this.grid[y][x - 1] as IGridToken)?.ansi;
                const right = (this.grid[y][x + 1] as IGridToken)?.ansi;

                // Left and right share same ansi - NO ANSI
                if (token.ansi === left && token.ansi === right) {
                    operations.push({ x, y, char: token.char });

                    // Only right shares ansi - OPEN ANSI
                } else if (token.ansi !== left && token.ansi === right) {
                    operations.push({ x, y, char: token.ansi + token.char });

                    // Only left shares ansi - CLOSE ANSI
                } else if (token.ansi === left && token.ansi !== right) {
                    operations.push({ x, y, char: token.char + ANSI_RESET });

                    // Left and right share no ansi similarities - OPEN AND CLOSE ANSI
                } else {
                    operations.push({ x, y, char: token.ansi + token.char + ANSI_RESET });
                }
            });
        });

        operations.forEach((op) => {
            this.grid[op.y][op.x] = op.char;
        });

        return this.grid as string[][];
    }

    public pushToken(x: number, y: number): void {
        if (!this.tokens.has(y)) {
            this.tokens.set(y, new Set([x]));
        } else {
            this.tokens.get(y)!.add(x);
        }
    }
}
