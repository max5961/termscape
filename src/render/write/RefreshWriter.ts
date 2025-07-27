import { Canvas } from "../../canvas/Canvas.js";
import { Cursor } from "../Cursor.js";
import { Writer } from "./Writer.js";

export class RefreshWriter extends Writer {
    // lastOutput should be shared between the Writer strategies.  In order to
    // handle this, cursor should update its last output when it performs execute
    // and that should be the source of truth for the last write. However, it should
    // not update the ansi sequences sent to move the cursor.  It should only update
    // the actual output.  If we are coming from a PreciseWriter write, then
    // the last output string will never probably not match and this is no problem.
    private lastOutput: string;

    constructor(cursor: Cursor) {
        super(cursor);
        this.lastOutput = "";
    }

    public writeToStdout(lastCanvas: Canvas, nextCanvas: Canvas): void {
        // Cannot use `getStringCanvas` because we want to be able to diff our
        // previous canvas with tokens.  Getting the string canvas would overwrite
        // everything. So we need to untokenize each row instead.
        // .getStringCanvas()

        let newlines = 0;
        const output = nextCanvas.grid
            .map((row, y) => {
                ++newlines;
                // prettier-ignore
                return nextCanvas.tokens
                    // Consider having convertSegment NOT require a sliced copy. 
                    // (might not even need one...)
                    .convertSegment(y, row.slice())
                    .trimEnd() + "\n";
            })
            .join("")
            .trimEnd();

        if (output !== this.lastOutput) {
            // Clear previous rows
            this.cursor.clearRowsUp(lastCanvas.grid.length);

            // TO IMPLEMENT (-1 because we trimEnd on the final output)
            // this.cursor.pushOutput(output, newLines - 1);

            this.cursor.execute();
        }
    }
}
