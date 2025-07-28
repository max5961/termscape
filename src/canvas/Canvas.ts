import { ANSI_RESET } from "../constants.js";
import { Point } from "../types.js";
import { GridTokens, IGridToken } from "./GridToken.js";
import { Pen } from "./Pen.js";

type SubCanvasConfig = {
    /**
     * If not provided a 0x0 grid will be created, by which subgrids will inherit
     * from.
     */
    grid: (string | IGridToken)[][];
    /** Used to store tokens for conversion after drawing operations are finished */
    tokens: GridTokens;
    /** How far down from the corner can we legally draw? */
    height: number;
    /** How far right from the corner can we legally draw? */
    width: number;
    /** Corner position of the grid.  This helps define boundaries. */
    corner: Point;
};

export class Canvas {
    private pos: { x: number; y: number };
    public grid: (string | IGridToken)[][];
    public corner: Readonly<Point>;
    public height: number;
    public width: number;
    public tokens: GridTokens;

    constructor(config?: SubCanvasConfig) {
        const cols = process.stdout.columns;
        const rows = process.stdout.rows;

        if (config) {
            this.grid = config.grid;
            this.tokens = config.tokens;
            this.height = config.height;
            this.width = config.width;
            this.corner = config.corner;
        } else {
            // NOTE: rows are added on demand so that mt rows aren't part of output str
            this.grid = [];
            this.tokens = new GridTokens(this.grid);
            this.height = rows;
            this.width = cols;
            this.corner = { x: 0, y: 0 };
        }

        this.pos = { ...this.corner };

        const xBorder = Math.min(this.corner.x + this.width, cols);
        const yBorder = Math.min(this.corner.y + this.height, rows);
        this.width = xBorder - this.corner.x;
        this.height = yBorder - this.corner.y;
    }

    public getPen(opts: { linked?: boolean } = {}) {
        const { linked = false } = opts;

        return new Pen({
            linked,
            pos: this.pos,
            canvas: this,
        });
    }

    public stringifyRowSegment(y: number, start?: number, end?: number): string {
        const row = this.grid[y];
        if (!row) return "";

        start = start ?? 0;
        end = end ?? row.length;

        const length = end - start;
        const result = new Array(length + 1);
        result[0] = ANSI_RESET;

        for (let i = 0; i < length; ++i) {
            const token = row[i + start];
            const leftAnsi = (row[i + start - 1] as IGridToken)?.ansi;
            const rightAnsi = (row[i + start + 1] as IGridToken)?.ansi;

            result[i + 1] = this.convertToken(token, leftAnsi, rightAnsi);
        }

        return result.join("");
    }

    private convertToken(
        token: string | IGridToken,
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
            return token.char + ANSI_RESET;

            // Left and right share no ansi similarities - OPEN AND CLOSE ANSI
        } else {
            return token.ansi + token.char + ANSI_RESET;
        }
    }
}
