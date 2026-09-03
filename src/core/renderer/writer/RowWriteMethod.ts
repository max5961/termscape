import type { Grid } from "../../canvas/types.js";
import type { CoreRootElement } from "../../CoreRootElement.js";
import type { Cursor } from "../Cursor.js";
import { GridConverter } from "../GridConverter.js";
import { WriteMethod, type Row } from "./WriteMethod.js";

export class RowWriteMethod extends WriteMethod {
    constructor(root: CoreRootElement, cursor: Cursor) {
        super(root, cursor);
    }

    public override loadCursor(lastGrid: Readonly<Grid>, nextGrid: Readonly<Grid>): void {
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
            this.cursor.moveToRow(y);
            this.cursor.pushStdout(GridConverter.stringifyRow(nextGrid, y), 0);
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
        if (row.length < this.root.stdout.columns) {
            this.cursor.moveToCol(row.length);
            this.cursor.clearFromCursor();
        }
    }
}
