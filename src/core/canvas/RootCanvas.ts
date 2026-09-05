import { Canvas } from "./Canvas.js";
import type { Grid, PenLimits } from "./types.js";
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

    public cloneGrid() {
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
}
