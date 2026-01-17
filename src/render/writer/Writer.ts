import type { Canvas, Grid } from "../../compositor/Canvas.js";
import type { Root } from "../../dom/RootElement.js";
import type { GridToken } from "../../Types.js";
import type { Cursor } from "../Cursor.js";

export type Row = Canvas["grid"][number];

export abstract class Writer {
    protected _cursor: Cursor;
    protected _root: Root;

    constructor(cursor: Cursor, root: Root) {
        this._cursor = cursor;
        this._root = root;
    }

    /**
     * Tells the cursor which operations it needs to perform to render the latest
     * Canvas.  The cursor will perform (write) these operations later.
     */
    public abstract instructCursor(lastGrid: Grid | undefined, nextGrid: Grid): void;

    protected isCellDiff(prev: GridToken | string | undefined, next: GridToken | string) {
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

    protected clearLostRows(lastRows: number, nextRows: number) {
        const diff = lastRows - nextRows;
        if (diff <= 0) return;

        this._cursor.clearRowsUp(diff);
    }

    /**
     * Force the terminal itself to scroll by writing newlines.  This ensures that
     * the virtual row number the cursor tracks remains valid.
     * */
    protected appendNewRows(lastGrid: Grid, newRows: number) {
        if (newRows) {
            this._cursor.moveToRow(lastGrid.length - 1);
            this._cursor.deferOutput("\n".repeat(newRows), newRows);
        }
    }
}
