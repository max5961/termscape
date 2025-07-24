import { GridTokens, IGridToken } from "./GridToken.js";
import { Pen } from "./Pen.js";

type CanvasProps = {
    /**
     * If not provided, a new grid will be created with dimensions of 0x0.  Subgrids
     * will then inherit from this grid.
     * */
    grid?: (string | IGridToken)[][];

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
    public gridTokens: GridTokens;
    public corner: Readonly<Required<CanvasProps>["corner"]>;
    private pos: { x: number; y: number };
    public height: number;
    public width: number;

    constructor(props: CanvasProps = {}) {
        const cols = process.stdout.columns;
        const rows = process.stdout.rows;

        props.dim = props.dim ?? { width: cols, height: rows };

        this.corner = props.corner ?? { x: 0, y: 0 };
        this.pos = { ...this.corner };

        const xBorder = Math.min(this.corner.x + props.dim.width, cols);
        const yBorder = Math.min(this.corner.y + props.dim.height, rows);
        this.width = xBorder - this.corner.x;
        this.height = yBorder - this.corner.y;

        // NOTE: grid rows are added on demand, so that empty rows are not added
        // to the output string
        this.grid = props.grid ?? [];
        this.gridTokens = new GridTokens(this.grid);
    }

    public getPen(opts: { linked?: boolean } = {}) {
        const { linked = false } = opts;

        return new Pen({
            linked,
            pos: this.pos,
            canvas: this,
            gridTokens: this.gridTokens,
        });
    }

    public getGrid = (): string[][] => {
        return this.gridTokens.convertTokens();
    };

    public toString = () => {
        return this.gridTokens
            .convertTokens()
            .map((row) => {
                return row.join("").trimEnd() + "\n";
            })
            .join("")
            .trimEnd();
    };
}
