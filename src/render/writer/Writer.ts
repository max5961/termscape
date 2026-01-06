import type { Grid } from "../../compositor/Canvas.js";
import type { Root } from "../../dom/RootElement.js";
import type { Cursor } from "../Cursor.js";

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
}
