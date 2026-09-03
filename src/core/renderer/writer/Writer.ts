import { isFullscreen } from "../../../util.js";
import { Ansi } from "../../Ansi.js";
import type { Grid } from "../../canvas/types.js";
import type { CoreRootElement } from "../../CoreRootElement.js";
import { Cursor } from "../Cursor.js";
import { StateChange } from "../RenderStateChange.js";
import { CellWriteMethod } from "./CellWriteMethod.js";
import { RefreshWriteMethod } from "./RefreshWriteMethod.js";
import { RowWriteMethod } from "./RowWriteMethod.js";
import type { WriteMethod } from "./WriteMethod.js";

export class Writer {
    private readonly root: CoreRootElement;
    private readonly cursor: Cursor;
    private readonly refresh: RefreshWriteMethod;
    private readonly row: RowWriteMethod;
    private readonly cell: CellWriteMethod;
    private lastGrid: Readonly<Grid> | undefined;
    private nextGrid: Readonly<Grid> | undefined;
    private writesSinceLastResize: number;
    private termSupportsAnsiCursor: boolean;

    constructor(root: CoreRootElement) {
        this.root = root;
        this.cursor = new Cursor(root);
        this.refresh = new RefreshWriteMethod(root, this.cursor);
        this.row = new RowWriteMethod(root, this.cursor);
        this.cell = new CellWriteMethod(root, this.cursor);
        this.writesSinceLastResize = Infinity;
        this.termSupportsAnsiCursor = this.getTermSupportsAnsiCursor();
    }

    public write(nextGrid: Readonly<Grid>, bitmask: number, capturedOutput: string) {
        this.handleResizeCounter(bitmask);
        this.lastGrid = this.nextGrid;
        this.nextGrid = nextGrid;

        if (!this.lastGrid) {
            this.refresh.loadCursor(this.lastGrid, this.nextGrid, capturedOutput);
        } else {
            const method = this.getWriteMethod(bitmask, capturedOutput);
            method.loadCursor(this.lastGrid, this.nextGrid, capturedOutput);

            if (method !== this.refresh) {
                this.refresh.resetLastOutput();
            }
        }
        this.cursor.moveToRow(this.nextGrid.length - 1);

        this.root.stdout.write(Ansi.beginSynchronizedUpdate);
        this.cursor.execute();
        this.root.stdout.write(Ansi.endSynchronizedUpdate);
    }

    private getWriteMethod(bitmask: number, capturedOutput?: string): WriteMethod {
        if (this.root.runtimeControl.writeMode === "refresh") {
            return this.refresh;
        }
        if (capturedOutput && !isFullscreen(this.nextGrid, this.root.stdout)) {
            return this.refresh;
        }
        if (bitmask & StateChange.Screen) {
            return this.refresh;
        }
        if (bitmask & StateChange.StartRuntime) {
            return this.refresh;
        }
        if (this.writesSinceLastResize < 2) {
            return this.refresh;
        }
        if (!this.termSupportsAnsiCursor) {
            return this.refresh;
        }
        return this.root.runtimeControl.writeMode === "cell" ? this.cell : this.row;
    }

    private handleResizeCounter(bitmask: number) {
        if (bitmask & StateChange.Resize) {
            this.writesSinceLastResize = -1;
        }
        ++this.writesSinceLastResize;
    }

    private getTermSupportsAnsiCursor() {
        const term = this.root.runtimeControl.process.env?.["TERM"];
        return !!term?.match(/xterm|kitty|alacritty|ghostty|konsole/);
    }
}
