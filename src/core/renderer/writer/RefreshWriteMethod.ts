import { isFullscreen } from "../../../util.js";
import type { Grid } from "../../canvas/types.js";
import type { CoreRootElement } from "../../CoreRootElement.js";
import type { Cursor } from "../Cursor.js";
import { GridConverter } from "../GridConverter.js";
import { WriteMethod } from "./WriteMethod.js";

export class RefreshWriteMethod extends WriteMethod {
    private lastOutput: string;

    constructor(root: CoreRootElement, cursor: Cursor) {
        super(root, cursor);
        this.lastOutput = "";
    }

    public override loadCursor(
        lastGrid: Readonly<Grid> | undefined,
        nextGrid: Readonly<Grid>,
        capturedOutput?: string,
    ): void {
        const { newLines, output } = GridConverter.stringifyGrid(nextGrid);

        if (output === this.lastOutput && !capturedOutput) {
            return this.cursor.clearOps();
        }
        this.lastOutput = output;

        if (lastGrid) {
            this.cursor.clearRowsUp(lastGrid.length);
        }

        // Write console statements before rendered output
        if (capturedOutput && !isFullscreen(nextGrid, this.root.stdout)) {
            capturedOutput = capturedOutput.trimEnd() + "\n";
            this.cursor.pushStdout(capturedOutput, 0);
        }
        this.cursor.pushStdout(output, newLines);
    }

    public resetLastOutput() {
        this.lastOutput = "";
    }
}
