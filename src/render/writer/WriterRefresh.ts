import type { Root } from "../../dom/RootElement.js";
import type { Cursor } from "./../Cursor.js";
import { Canvas, type Grid } from "../../compositor/Canvas.js";
import { Writer } from "./Writer.js";
import { logger } from "../../shared/Logger.js";

export class WriterRefresh extends Writer {
    private lastOutput: string;

    constructor(cursor: Cursor, root: Root) {
        super(cursor, root);
        this.lastOutput = "";
    }

    public instructCursor(
        lastGrid: Grid | undefined,
        nextGrid: Grid,
        capturedOutput?: string,
    ): void {
        const { newLines, output } = Canvas.stringifyGrid(nextGrid);

        if (output !== this.lastOutput || capturedOutput) {
            if (lastGrid) {
                this.cursor.clearRowsUp(lastGrid.length);
            }

            const fullscreen = this.isFullscreen(nextGrid);

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

    public isFullscreen(grid: Grid) {
        return grid.length >= this.root.runtime.stdout.rows;
    }
}
