import { Canvas } from "../../canvas/Canvas.js";
import { Cursor } from "../Cursor.js";
import { Writer } from "./Writer.js";

export class RefreshWriter extends Writer {
    private lastOutput: string;

    constructor(cursor: Cursor) {
        super(cursor);
        this.lastOutput = "";
    }

    public instructCursor(
        lastCanvas: Canvas | null,
        nextCanvas: Canvas,
        capturedOutput?: string,
    ): void {
        // Rather than write each row then move cursor down, use \n to make
        // sure that terminals not supporting ansi sequences will render properly.

        let newLines = 0;
        const output = nextCanvas.grid
            .map((_row, y) => {
                ++newLines;
                const nl = y === nextCanvas.grid.length - 1 ? "" : "\n";
                // prettier-ignore
                return nextCanvas
                    .stringifyRowSegment(y)
                    .trimEnd() + nl;
            })
            .join("");

        if (output !== this.lastOutput || capturedOutput) {
            if (lastCanvas) {
                this.cursor.clearRowsUp(lastCanvas.grid.length);
            }

            const fullscreen = this.isFullscreen(nextCanvas);

            // NOT FULLSCREEN => CONSOLE BEFORE OUTPUT
            if (capturedOutput && !fullscreen) {
                process.stdout.write(capturedOutput);
            }

            this.cursor.deferOutput(output, newLines - 1);

            // FULLSCREEN => CONSOLE OVERLAYS OUTPUT
            // This should be until post layout hooks are more better integrated
            // and can handle this better
            if (capturedOutput && fullscreen) {
                let lines = capturedOutput.split("\n").length;
                if (capturedOutput.endsWith("\n") && capturedOutput.trimEnd()) {
                    --lines;
                }
                this.cursor.rowsUp(lines);
                this.cursor.deferOutput(capturedOutput, lines);
            }
        } else {
            this.cursor.clearOps();
        }
    }

    public resetLastOutput() {
        this.lastOutput = "";
    }

    public isFullscreen(nextCanvas: Canvas) {
        return nextCanvas.height === process.stdout.rows;
    }
}
