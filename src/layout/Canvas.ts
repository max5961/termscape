type CanvasProps = {
    /**
     * If not provided, a new grid will be created with dimensions of 0x0.  Subgrids
     * will then inherit from this grid.
     * */
    grid?: string[][];

    /**
     * The corner position of the grid, which also acts helps define minimum x and
     * y values.  For example, cannot fill a 2d array at [-1][-1], and a subgrid
     * should not be allowed to retreat past its corner in either direction.
     *
     * @default `{x: 0; y: 0}`
     */
    corner?: { x: number; y: number };

    /**
     * The dimensions of the grid or subgrid.  How far from the corner can we draw?
     *
     * @default `{ x: process.stdout.columns; y: process.stdout.rows }`
     */
    dim?: { width: number; height: number };
};

export class Canvas {
    public grid: Required<CanvasProps>["grid"];
    public corner: Readonly<Required<CanvasProps>["corner"]>;
    public max: { x: number; y: number };
    public min: { x: number; y: number };
    private pos: { x: number; y: number };

    constructor(props: CanvasProps = {}) {
        props.dim = props.dim ?? {
            width: process.stdout.columns,
            height: process.stdout.rows,
        };

        this.corner = props.corner ?? { x: 0, y: 0 };
        this.max = {
            x: Math.min(this.corner.x + props.dim.width, process.stdout.columns),
            y: Math.min(this.corner.y + props.dim.height, process.stdout.rows),
        };
        this.min = { ...this.corner };
        this.pos = { ...this.corner };

        // Start out with an empty grid, add rows as needed.
        this.grid = props.grid ?? [];
    }

    private pushRow(): void {
        if (this.grid.length >= this.max.y) return;

        this.grid.push(
            Array.from({ length: process.stdout.columns }).fill(" ") as string[],
        );
    }

    public moveTo(x: number, y: number): Canvas {
        this.pos.x = this.corner.x + x;
        this.pos.y = this.corner.y + y;
        return this;
    }

    public move(dir: "U" | "D" | "L" | "R", units: number): Canvas {
        if (dir === "U") this.pos.y -= units;
        if (dir === "D") this.pos.y += units;
        if (dir === "L") this.pos.x -= units;
        if (dir === "R") this.pos.x += units;
        return this;
    }

    public draw(char: string, dir: "U" | "D" | "L" | "R", units: number): Canvas {
        if (char === "") return this;

        let dx = 0;
        let dy = 0;

        if (dir === "U") dy = -1;
        if (dir === "D") dy = 1;
        if (dir === "L") dx = -1;
        if (dir === "R") dx = 1;

        let { x, y } = this.pos;

        for (let i = 0; i < units; ++i) {
            x += dx;
            y += dy;

            if (x > this.max.x || x < this.min.x || y > this.max.y || y < this.min.y) {
                break;
            }

            // Don't push a row if we are attempting to draw out of bounds.  Since
            // we can only draw straight lines, there's a possibility we go back in
            // bounds, but we can handle pushing a new row if and when that occurs.
            if (this.grid[y] === undefined && x <= this.max.x) {
                this.pushRow();
            }

            if (this.grid[y]?.[x] !== undefined) {
                this.grid[y][x] = char;
            }
        }

        return this;
    }

    public toString() {
        return this.grid
            .map((row) => {
                return row.join("").trimEnd() + "\n";
            })
            .join("");
    }
}
