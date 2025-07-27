import { Canvas } from "../../canvas/Canvas.js";
import { Cursor } from "../Cursor.js";

export abstract class Writer {
    protected cursor: Cursor;

    constructor(cursor: Cursor) {
        this.cursor = cursor;
    }

    public abstract writeToStdout(last: Canvas, next: Canvas): void;
}
