import { Canvas } from "../../canvas/Canvas.js";
import { GridToken } from "../../types.js";
import { Cursor } from "../Cursor.js";
import { Writer } from "./Writer.js";

type Row = Canvas["grid"][number];
type Slice = { s: number; e: number };

export class PreciseWriter extends Writer {
    constructor(cursor: Cursor) {
        super(cursor);
    }

    public instructCursor(lastCanvas: Canvas, nextCanvas: Canvas): void {
        const { grid: last } = lastCanvas;
        const { grid: next } = nextCanvas;

        this.clearLostRows(last.length, next.length);

        /** maps dirty row #s to the index where there is a diff */
        const dirtyRows = [] as [number, { s: number; e: number }[]][];

        for (let y = 0; y < next.length; ++y) {
            // `next` has new rows
            if (last[y] === undefined) {
                dirtyRows.push([y, [{ s: 0, e: next[y].length }]]);
                continue;
            }

            const slices = this.createRowDiff(last[y], next[y]);

            if (slices.length) dirtyRows.push([y, slices]);
        }

        dirtyRows.forEach(([row, indexes]) => {
            this.cursor.moveToRow(row);

            for (const slice of indexes) {
                const output = nextCanvas.stringifyRowSegment(row, slice.s, slice.e);

                this.cursor.moveToCol(slice.s);
                this.cursor.deferOutput(output, 0);
            }

            // If last row is longer than next row, the rest of the row must be cleared.
            const toClearFrom = nextCanvas.grid[row].length;
            if (toClearFrom < process.stdout.columns) {
                this.cursor.moveToCol(toClearFrom);
                this.cursor.clearFromCursor();
            }
        });
    }

    // - next is shorter than last =>
    // - last is shorter than next =>
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
