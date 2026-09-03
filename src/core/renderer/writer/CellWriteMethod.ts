import type { Grid } from "../../canvas/types.js";
import type { CoreRootElement } from "../../CoreRootElement.js";
import type { Cursor } from "../Cursor.js";
import { GridConverter } from "../GridConverter.js";
import { WriteMethod, type Row } from "./WriteMethod.js";

type Slice = { s: number; e: number };

export class CellWriteMethod extends WriteMethod {
    constructor(root: CoreRootElement, cursor: Cursor) {
        super(root, cursor);
    }

    public override loadCursor(lastGrid: Readonly<Grid>, nextGrid: Readonly<Grid>): void {
        this.clearLostRows(lastGrid.length, nextGrid.length);

        const dirtyRows = [] as [number, Slice[]][];
        const shorterRows = [] as [number, number][];
        let newRows = 0;

        for (let y = nextGrid.length - 1; y >= 0; --y) {
            // New row
            if (lastGrid[y] === undefined) {
                dirtyRows.push([y, [{ s: 0, e: nextGrid[y].length }]]);
                ++newRows;
                continue;
            }

            // Shorter row
            if (lastGrid[y].length > nextGrid[y].length) {
                shorterRows.push([y, nextGrid[y].length]);
            }

            // Diffs
            const slices = this.createRowDiff(lastGrid[y], nextGrid[y]);
            if (slices.length) dirtyRows.push([y, slices]);
        }

        this.appendNewRows(lastGrid, newRows);

        // Trim shorter rows because createRowDiff only produces diffs for the length of the next row
        shorterRows.forEach(([row, col]) => {
            this.cursor.moveToRow(row);
            this.cursor.moveToCol(col);
            this.cursor.clearFromCursor();
        });

        dirtyRows.forEach(([row, indexes]) => {
            this.cursor.moveToRow(row);

            for (const slice of indexes) {
                const output = GridConverter.stringifyRowSegment(
                    nextGrid,
                    row,
                    slice.s,
                    slice.e,
                );

                this.cursor.moveToCol(slice.s);
                this.cursor.pushStdout(output, 0);
            }
        });
    }

    private createRowDiff(prev: Row, next: Row): Slice[] {
        const slices = [] as Slice[];

        let startDiff: number | undefined;
        for (let x = 0; x < next.length; ++x) {
            const diff = this.isCellDiff(prev[x], next[x]);

            if (diff && startDiff === undefined) {
                startDiff = x;
            }

            if (startDiff !== undefined) {
                if (!diff) {
                    slices.push({ s: startDiff, e: x });
                    startDiff = undefined;
                } else {
                    if (x === next.length - 1) {
                        slices.push({ s: startDiff, e: x + 1 });
                        startDiff = undefined;
                    }
                }
            }
        }

        return slices;
    }
}
