import type { Grid, GridToken } from "../../canvas/types.js";
import type { CoreRootElement } from "../../CoreRootElement.js";
import type { Cursor } from "../Cursor.js";

export type Row = Grid[number];

export abstract class WriteMethod {
    protected root: CoreRootElement;
    protected cursor: Cursor;

    constructor(root: CoreRootElement, cursor: Cursor) {
        this.root = root;
        this.cursor = cursor;
    }

    /**
     * Tells the cursor which operations it needs to perform to render the latest
     * Canvas.  The cursor will perform (write) these operations later.
     */
    public abstract loadCursor(
        lastGrid: Readonly<Grid>,
        nextGrid: Readonly<Grid>,
        capturedOutput?: string,
    ): void;

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

        this.cursor.clearRowsUp(diff);
    }

    /**
     * Force the terminal itself to scroll by writing newlines.  This ensures that
     * the virtual row number the cursor tracks remains valid.
     * */
    protected appendNewRows(lastGrid: Readonly<Grid>, newRows: number) {
        if (newRows) {
            this.cursor.moveToRow(lastGrid.length - 1);
            this.cursor.pushStdout("\n".repeat(newRows), newRows);
        }
    }
}
