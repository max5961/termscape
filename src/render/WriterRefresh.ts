import type { Root } from "../dom/Root.js";
import type { Cursor } from "./Cursor.js";
import type { Canvas } from "../compositor/Canvas.js";
import { Writer } from "./Writer.js";

export class WriterRefresh extends Writer {
    private lastOutput: string;

    constructor(cursor: Cursor, root: Root) {
        super(cursor, root);
        this.lastOutput = "";
    }

    public instructCursor(
        lastCanvas: Canvas | null,
        nextCanvas: Canvas,
        capturedOutput?: string,
    ): void {
        const { newLines, output } = nextCanvas.stringifyGrid();

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
        return nextCanvas.grid.length >= this.root.runtime.stdout.rows;
    }
}
