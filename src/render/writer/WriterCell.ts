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

        const dirtyRows = [] as [number, { s: number; e: number }[]][];
        const shorterRows = [] as [number, number][];
        const appendedRows = new Set<number>();

        for (let y = nextGrid.length - 1; y >= 0; --y) {
            // New row
            if (lastGrid[y] === undefined) {
                dirtyRows.push([y, [{ s: 0, e: nextGrid[y].length }]]);
                appendedRows.add(y);
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

        // Force the terminal itself to scroll by writing newlines, so that the virtual row number the cursor tracks will remain valid.
        if (appendedRows.size) {
            this._cursor.moveToRow(lastGrid.length - 1);
            this._cursor.deferOutput("\n".repeat(appendedRows.size), appendedRows.size);
        }

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

        this._cursor.clearRowsUp(diff);
    }
}
