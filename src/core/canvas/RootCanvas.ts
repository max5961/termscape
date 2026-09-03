import { Ansi } from "../Ansi.js";
import { Canvas } from "./Canvas.js";
import type { Grid, GridToken, PenLimits } from "./types.js";
import type { CoreRootElement } from "../CoreRootElement.js";
import type { Point, StdoutLike } from "../../Types.js";

export class RootCanvas extends Canvas {
    public override readonly core: CoreRootElement;
    public override readonly corner: Point;
    public override readonly grid: Grid;
    public override ygHeight!: number;
    public override ygWidth!: number;
    public override limits!: PenLimits;
    public override stdout: StdoutLike;

    constructor(core: CoreRootElement) {
        super();
        this.core = core;
        this.stdout = core.stdout;
        this.grid = [];
        this.corner = { x: 0, y: 0 };
        this.updateRootConstraints();
    }

    public updateRootConstraints() {
        const stdout = this.core.stdout;
        const maxHeight = stdout.rows;
        const maxWidth = stdout.columns;

        this.ygHeight = maxHeight;
        this.ygWidth = maxWidth;
        this.limits = {
            minX: 0,
            minY: 0,
            maxX: maxWidth,
            maxY: maxHeight,
        };
    }

    public resetGrid() {
        this.grid.length = 0;
    }

    public copyGrid() {
        return this.grid.map((row) => row.slice());
    }

    public clearGrid() {
        for (let i = 0; i < this.grid.length; ++i) {
            this.grid[i].length = this.stdout.columns;
            this.grid[i].fill(" ");
        }
    }

    public removeTrailingWhitespace() {
        this.grid.forEach((row) => {
            let i = row.length - 1;
            while (row[i--] === " ") {
                row.pop();
            }
        });
    }

    public stringifyRowSegment(y: number, start?: number, end?: number) {
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

    public stringifyRow(y: number) {
        return this.stringifyRowSegment(y);
    }

    public stringifyGrid(): { newLines: number; output: string } {
        let newLines = 0;
        const output = this.grid
            .map((_row, y) => {
                const nl = y === this.grid.length - 1 ? "" : "\n";
                if (nl) ++newLines;

                // prettier-ignore
                return this
                    .stringifyRow(y)
                    .trimEnd() + nl;
            })
            .join("");

        return { newLines, output };
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
