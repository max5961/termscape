import type { Canvas } from "../../compositor/Canvas.js";
import type { Root } from "../../dom/RootElement.js";
import type { Cursor } from "../Cursor.js";

export abstract class Writer {
    protected cursor: Cursor;
    protected root: Root;

    constructor(cursor: Cursor, root: Root) {
        this.cursor = cursor;
        this.root = root;
    }

    /**
     * Tells the cursor which operations it needs to perform to render the latest
     * Canvas.  The cursor will perform (write) these operations later.
     */
    public abstract instructCursor(last: Canvas | null, next: Canvas): void;
}
