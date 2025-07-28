import { Canvas } from "../../canvas/Canvas.js";
import { GridToken } from "../../types.js";
import { Cursor } from "../Cursor.js";
import { Writer } from "./Writer.js";

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

            const slices = [] as { s: number; e: number }[];
            let slice = { s: -1, e: -1 };
            let push = false;
            for (let x = 0; x < next[y].length; ++x) {
                if (this.isEqual(last[y][x], next[y][x])) {
                    if (slice.s !== -1) {
                        slice.e = x;
                        push = true;
                    }
                } else if (slice.s === -1) {
                    slice.s = x;
                    if (x === next[y].length - 1) {
                        slice.e = next[y].length;
                        push = true;
                    }
                }

                if (push) {
                    slices.push(slice);
                    slice = { s: -1, e: -1 };
                    push = false;
                }
            }

            if (slices.length) dirtyRows.push([y, slices]);
        }

        dirtyRows.forEach(([row, indexes]) => {
            this.cursor.moveToRow(row);

            for (const slice of indexes) {
                const output = nextCanvas.stringifyRowSegment(row, slice.s, slice.e);

                this.cursor.moveToCol(slice.s);
                this.cursor.deferOutput(output, 0);
            }
        });
    }

    private isEqual(prev: GridToken | string, next: GridToken | string) {
        if (typeof prev === "string") {
            return prev === next;
        } else {
            return (
                prev.ansi === (next as GridToken).ansi &&
                prev.char === (next as GridToken).char
            );
        }
    }

    private clearLostRows(lastRows: number, nextRows: number) {
        const diff = lastRows - nextRows;
        if (diff <= 0) return;

        this.cursor.clearRowsUp(diff);
    }
}
