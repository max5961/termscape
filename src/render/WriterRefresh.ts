import { Canvas } from "../compositor/Canvas.js";
import { Cursor } from "./Cursor.js";
import { Writer } from "./Writer.js";

export class WriterRefresh extends Writer {
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
        let newLines = 0;
        const output = nextCanvas.grid
            .map((_row, y) => {
                const nl = y === nextCanvas.grid.length - 1 ? "" : "\n";
                if (nl) ++newLines;

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
                capturedOutput = capturedOutput.trimEnd() + "\n";
                if (!process.env["RENDER_DEBUG"]) {
                    process.stdout.write(capturedOutput);
                } else {
                    this.cursor.deferOutput(capturedOutput, 0);
                }
            }

            this.cursor.deferOutput(output, newLines);
        } else {
            this.cursor.clearOps();
        }
    }

    public resetLastOutput() {
        this.lastOutput = "";
    }

    public isFullscreen(nextCanvas: Canvas) {
        return nextCanvas.grid.length >= process.stdout.rows;
    }
}
