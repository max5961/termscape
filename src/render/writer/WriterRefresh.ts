import type { Root } from "../../dom/RootElement.js";
import type { Cursor } from "./../Cursor.js";
import { Canvas, type Grid } from "../../compositor/Canvas.js";
import { Writer } from "./Writer.js";
import { isFullscreen } from "../../Util.js";

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

        if (output === this.lastOutput && !capturedOutput) {
            return this._cursor.clearOps();
        }

        if (lastGrid) {
            this._cursor.clearRowsUp(lastGrid.length);
        }

        // Write console statements before rendered output
        if (capturedOutput && !isFullscreen(nextGrid, this._root.runtime.stdout)) {
            capturedOutput = capturedOutput.trimEnd() + "\n";
            this._cursor.deferOutput(capturedOutput, 0);
            // if (!process.env["RENDER_DEBUG"]) {
            //     process.stdout.write(capturedOutput);
            // } else {
            //     this._cursor.deferOutput(capturedOutput, 0);
            // }
        }
        this._cursor.deferOutput(output, newLines);
    }

    public resetLastOutput() {
        this.lastOutput = "";
    }
}
