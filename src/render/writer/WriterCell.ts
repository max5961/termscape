import { Writer } from "./Writer.js";
import type { Cursor } from "../Cursor.js";
import { Canvas, type Grid } from "../../compositor/Canvas.js";
import type { GridToken } from "../../Types.js";
import type { Root } from "../../dom/RootElement.js";

type Row = Canvas["grid"][number];
type Slice = { s: number; e: number };

export class WriterCell extends Writer {
    constructor(cursor: Cursor, root: Root) {
        super(cursor, root);
    }

    public instructCursor(lastGrid: Grid, nextGrid: Grid): void {
        this.clearLostRows(lastGrid.length, nextGrid.length);

        /** maps dirty row #s to the index where there is a diff */
        const dirtyRows = [] as [number, { s: number; e: number }[]][];
        const appendedRows = new Set<number>();

        for (let y = nextGrid.length - 1; y >= 0; --y) {
            // `nextGrid` has new rows
            if (lastGrid[y] === undefined) {
                dirtyRows.push([y, [{ s: 0, e: nextGrid[y].length }]]);
                appendedRows.add(y);
                continue;
            }

            const slices = this.createRowDiff(lastGrid[y], nextGrid[y]);

            if (slices.length) dirtyRows.push([y, slices]);
        }

        if (appendedRows.size) {
            this.cursor.moveToRow(lastGrid.length - 1);
            this.cursor.deferOutput("\n".repeat(appendedRows.size), appendedRows.size);

            // If the cursor position is 5 rows from the bottom, and we need to
            // write 10 new rows, then we need to tell the terminal to scroll by
            // writing a `\n` for each modified row.  If not, then the virtual
            // row number that the cursor tracks will not be valid.
        }

        dirtyRows.forEach(([row, indexes]) => {
            this.cursor.moveToRow(row);

            for (const slice of indexes) {
                const output = Canvas.stringifyRowSegment(
                    nextGrid,
                    row,
                    slice.s,
                    slice.e,
                );

                this.cursor.moveToCol(slice.s);
                this.cursor.deferOutput(output, 0);
            }

            // If last row is longer than next row, the rest of the row must be cleared.
            const toClearFrom = nextGrid[row].length;
            if (toClearFrom < process.stdout.columns) {
                this.cursor.moveToCol(toClearFrom);
                this.cursor.clearFromCursor();
            }
        });
    }

    // - nextGrid is shorter than lastGrid =>
    // - lastGrid is shorter than nextGrid =>
    // - Must clear from end of next row to end of term every time
    // public for testing
    public createRowDiff(prev: Row, next: Row): Slice[] {
        const slices = [] as Slice[];

        let startDiff: number | undefined;
        for (let x = 0; x < next.length; ++x) {
            const diff = this.isDiff(prev[x], next[x]);

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

    private isDiff(prev: GridToken | string | undefined, next: GridToken | string) {
        if (
            typeof prev === "string" ||
            typeof prev === "undefined" ||
            typeof next === "string" ||
            typeof next === "undefined"
        ) {
            return prev !== next;
        } else {
            return prev.ansi !== next.ansi || prev.char !== next.char;
        }
    }

    private clearLostRows(lastRows: number, nextRows: number) {
        const diff = lastRows - nextRows;
        if (diff <= 0) return;

        this.cursor.clearRowsUp(diff);
    }
}
