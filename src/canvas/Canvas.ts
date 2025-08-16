import type { Runtime } from "../dom/RuntimeFactory.js";
import type { ShadowStyle } from "../style/Style.js";
import type { GridToken, Point } from "../types.js";
import { Ansi } from "../util/Ansi.js";
import { Pen } from "./Pen.js";

export type Grid = (string | GridToken)[][];

export type CanvasDeps = {
    stdout: Runtime["api"]["stdout"];
    corner?: Point;
    cvHeight?: number;
    cvWidth?: number;
    nodeHeight?: number;
    nodeWidth?: number;
    grid?: Grid;
};

export type SubCanvasDeps = Required<CanvasDeps>;

export class Canvas {
    public pos: Point;
    public readonly grid: Grid;
    public readonly corner: Readonly<Point>;
    public readonly cvHeight: number;
    public readonly cvWidth: number;
    public readonly nodeHeight: number;
    public readonly nodeWidth: number;

    private readonly stdout: CanvasDeps["stdout"]; // Only used in root Canvas

    constructor(deps: CanvasDeps) {
        this.stdout = deps.stdout;
        this.grid = deps.grid ?? [];
        this.corner = deps.corner ?? { x: 0, y: 0 };
        this.cvHeight = deps.cvHeight ?? deps.stdout.rows;
        this.cvWidth = deps.cvWidth ?? deps.stdout.columns;
        this.nodeHeight = deps.nodeHeight ?? this.cvHeight;
        this.nodeWidth = deps.nodeWidth ?? this.cvWidth;
        this.pos = { ...this.corner };
    }

    public createSubCanvas({
        corner,
        nodeHeight,
        nodeWidth,
        canOverflowX,
        canOverflowY,
        parentStyle,
    }: {
        corner: Point;
        nodeHeight: number;
        nodeWidth: number;
        canOverflowX: boolean;
        canOverflowY: boolean;
        parentStyle: ShadowStyle;
    }) {
        // Parent (this) stops
        let pxstop = this.corner.x + this.cvWidth;
        let pystop = this.corner.y + this.cvHeight;

        // If parent node has a bottom|right edge set, the parent stops need to be adjusted
        if (parentStyle.overflowX === "hidden" && parentStyle.borderRight) {
            --pxstop;
        }
        if (parentStyle.overflowY === "hidden" && parentStyle.borderBottom) {
            --pystop;
        }

        // Child (subcanvas) stops
        let cxstop = corner.x + nodeWidth;
        let cystop = corner.y + nodeHeight;

        // Prevent subcanvas's from exceeding parent canvas dimensions
        cxstop = Math.min(cxstop, pxstop);
        cystop = Math.min(cystop, pystop);

        // The subcanvas dimensions should fill the parent's dimensions or constrain
        // to the subcanvas node dimensions based on the `overflow` setting.
        const getConstrainedX = canOverflowX ? Math.max : Math.min;
        const getConstrainedY = canOverflowY ? Math.max : Math.min;
        const nextWidth = getConstrainedX(pxstop, cxstop) - corner.x;
        const nextHeight = getConstrainedY(pystop, cystop) - corner.y;

        return new SubCanvas({
            stdout: this.stdout,
            grid: this.grid,
            corner: corner,
            nodeWidth: nodeWidth,
            nodeHeight: nodeHeight,
            cvWidth: nextWidth,
            cvHeight: nextHeight,
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

    private requestNewRow() {
        if (this.grid.length < this.cvHeight) {
            this.grid.push(
                Array.from({ length: process.stdout.columns }).fill(" ") as string[],
            );
        }
    }
}
