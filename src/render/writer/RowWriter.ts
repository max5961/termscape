import type { Root } from "../../dom/RootElement.js";
import type { Cursor } from "../Cursor.js";
import { Canvas, type Grid } from "../../compositor/Canvas.js";
import { Writer } from "./Writer.js";

type Row = Canvas["grid"][number];

export class RowWriter extends Writer {
    constructor(cursor: Cursor, root: Root) {
        super(cursor, root);
    }

    public instructCursor(lastGrid: Grid, nextGrid: Grid): void {
        this.clearLostRows(lastGrid.length, nextGrid.length);

        const dirtyRows = [] as number[];
        let newRows = 0;

        for (let y = nextGrid.length - 1; y >= 0; --y) {
            if (lastGrid[y] === undefined) {
                ++newRows;
                dirtyRows.push(y);
                continue;
            }

            if (this.isRowDiff(lastGrid[y], nextGrid[y])) {
                dirtyRows.push(y);
            }
        }

        this.appendNewRows(lastGrid, newRows);

        dirtyRows.forEach((y) => {
            this._cursor.moveToRow(y);
            this._cursor.deferOutput(Canvas.stringifyRow(nextGrid, y), 0);
            this.clearRest(nextGrid[y]);
        });
    }

    private isRowDiff(prev?: Row, next?: Row) {
        if (!prev || !next) return true;
        if (prev.length !== next.length) return true;

        const length = Math.max(prev.length, next.length);
        for (let i = 0; i < length; ++i) {
            if (this.isCellDiff(prev[i], next[i])) {
                return true;
            }
        }

        return false;
    }

    private clearRest(row: Row) {
        if (row.length < this._root.runtime.stdout.columns) {
            this._cursor.moveToCol(row.length);
            this._cursor.clearFromCursor();
        }
    }
}
