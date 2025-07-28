import { Canvas } from "../../canvas/Canvas.js";
import { Cursor } from "../Cursor.js";

export abstract class Writer {
    protected cursor: Cursor;

    constructor(cursor: Cursor) {
        this.cursor = cursor;
    }

    /**
     * Tells the cursor which operations it needs to perform to render the latest
     * Canvas.  The cursor will perform (write) these operations later.
     */
    public abstract instructCursor(last: Canvas | null, next: Canvas): void;
}
