import { type GridToken, type Point } from "../types.js";
import { Ansi } from "../util/Ansi.js";
import { Pen } from "./Pen.js";

type SubCanvasConfig = {
    /**
     * If not provided a 0x0 grid will be created, by which subgrids will inherit
     * from.
     */
    grid: (string | GridToken)[][];
    /** How far down from the corner can we legally draw? */
    height: number;
    /** How far right from the corner can we legally draw? */
    width: number;
    /** Corner position of the grid.  This helps define boundaries. */
    corner: Point;
};

export class Canvas {
    private pos: { x: number; y: number };
    public grid: (string | GridToken)[][];
    public corner: Readonly<Point>;
    public height: number;
    public width: number;

    constructor(config?: SubCanvasConfig) {
        const cols = process.stdout.columns;
        const rows = process.stdout.rows;

        if (config) {
            this.grid = config.grid;
            this.height = config.height;
            this.width = config.width;
            this.corner = config.corner;
        } else {
            // NOTE: rows are added on demand so that mt rows aren't part of output str
            this.grid = [];
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
        result[0] = Ansi.style.reset;

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

        return result.join("") + Ansi.style.reset;
    }

    private convertToken(token: string | GridToken, leftAnsi: string, rightAnsi: string) {
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
}
