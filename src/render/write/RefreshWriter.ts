import { Canvas } from "../../canvas/Canvas.js";
import { Cursor } from "../Cursor.js";
import { Writer } from "./Writer.js";

export class RefreshWriter extends Writer {
    private lastOutput: string;

    constructor(cursor: Cursor) {
        super(cursor);
        this.lastOutput = "";
    }

    public writeToStdout(lastCanvas: Canvas | null, nextCanvas: Canvas): void {
        // Rather write each row then move cursor down, use \n to make
        // sure that terminals not supporting ansi sequences will render properly.

        let newLines = 0;
        const output = nextCanvas.grid
            .map((_row, y) => {
                ++newLines;
                // prettier-ignore
                return nextCanvas
                    .stringifyRowSegment(y)
                    .trimEnd() + "\n";
            })
            .join("")
            .trimEnd();

        if (output !== this.lastOutput) {
            if (lastCanvas) {
                this.cursor.clearRowsUp(lastCanvas.grid.length);
            }
            this.cursor.deferOutput(output, newLines - 1);
            this.cursor.execute();
        }
    }

    public resetLastOutput() {
        this.lastOutput = "";
    }
}
