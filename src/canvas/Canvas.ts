import type { Runtime } from "../dom/RuntimeFactory.js";
import type { GridToken, Point } from "../types.js";
import { Ansi } from "../util/Ansi.js";
import { Pen } from "./Pen.js";

export type Grid = (string | GridToken)[][];

export type CanvasDeps = {
    stdout: Runtime["api"]["stdout"];
    corner?: Point;
    height?: number;
    width?: number;
    nodeHeight?: number;
    nodeWidth?: number;
    grid?: Grid;
};

export type SubCanvasDeps = Required<CanvasDeps>;

export class Canvas {
    public pos: Point;
    public readonly grid: Grid;
    public readonly corner: Point;
    public readonly height: number;
    public readonly width: number;
    public readonly nodeHeight: number;
    public readonly nodeWidth: number;

    private readonly stdout: CanvasDeps["stdout"]; // Only used in root Canvas

    constructor(deps: CanvasDeps) {
        this.stdout = deps.stdout;
        this.grid = deps.grid ?? [];
        this.corner = deps.corner ?? { x: 0, y: 0 };
        this.height = deps.height ?? deps.stdout.rows;
        this.width = deps.width ?? deps.stdout.columns;
        this.nodeHeight = deps.nodeHeight ?? this.height;
        this.nodeWidth = deps.nodeWidth ?? this.width;
        this.pos = { ...this.corner };
    }

    public createSubCanvas({
        corner,
        height,
        width,
        canOverflowX,
        canOverflowY,
    }: {
        corner: Point;
        height: number;
        width: number;
        canOverflowX: boolean;
        canOverflowY: boolean;
    }) {
        const pxStop = this.corner.x + this.width;
        const pyStop = this.corner.y + this.height;

        const cxStop = corner.x + width;
        const cyStop = corner.y + height;

        const getConstrainedX = canOverflowX ? Math.max : Math.min;
        const getConstrainedY = canOverflowY ? Math.max : Math.min;

        const nextWidth = getConstrainedX(pxStop, cxStop) - corner.x;
        const nextHeight = getConstrainedY(pyStop, cyStop) - corner.y;

        return new SubCanvas({
            stdout: this.stdout,
            grid: this.grid,
            corner: corner,
            width: nextWidth,
            height: nextHeight,
            nodeWidth: width,
            nodeHeight: height,
        });
    }

    public getPen(): Pen {
        return new Pen({
            grid: this.grid,
            canvas: this,
        });
    }

    public stringifyRowSegment(y: number, start?: number, end?: number): string {
        const row = this.grid[y];
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

    // Should be available to Pen class for writing past node dimensions (overflow)
    // since subgrids only extend grid to their nodeheights
    public requestNewRow() {
        if (this.grid.length < this.height) {
            this.grid.push(
                Array.from({ length: process.stdout.columns }).fill(" ") as string[],
            );
        }
    }
}

class SubCanvas extends Canvas {
    constructor(deps: SubCanvasDeps) {
        super(deps);
        this.forceGridToAccomodate();
    }

    private forceGridToAccomodate() {
        const currDepth = this.grid.length;
        const requestedDepth = this.corner.y + this.nodeHeight;
        const rowsNeeded = requestedDepth - currDepth;

        for (let i = 0; i < rowsNeeded; ++i) {
            this.requestNewRow();
        }
    }
}
