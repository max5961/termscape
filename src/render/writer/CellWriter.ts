import { Writer, type Row } from "./Writer.js";
import type { Cursor } from "../Cursor.js";
import { Canvas, type Grid } from "../../compositor/Canvas.js";
import type { Root } from "../../dom/RootElement.js";

type Slice = { s: number; e: number };

export class CellWriter extends Writer {
    constructor(cursor: Cursor, root: Root) {
        super(cursor, root);
    }

    public instructCursor(lastGrid: Grid, nextGrid: Grid): void {
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
            this._cursor.moveToRow(row);
            this._cursor.moveToCol(col);
            this._cursor.clearFromCursor();
        });

        dirtyRows.forEach(([row, indexes]) => {
            this._cursor.moveToRow(row);

            for (const slice of indexes) {
                const output = Canvas.stringifyRowSegment(
                    nextGrid,
                    row,
                    slice.s,
                    slice.e,
                );

                this._cursor.moveToCol(slice.s);
                this._cursor.deferOutput(output, 0);
            }
        });
    }

    public createRowDiff(prev: Row, next: Row): Slice[] {
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
