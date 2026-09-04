import type { CoreRootElement } from "../CoreRootElement.js";
import { Ansi } from "../Ansi.js";
import { logger } from "../../util.js";

export class Cursor {
    protected readonly root: CoreRootElement;
    protected readonly ops: string[];
    protected currentRow: number;

    constructor(root: CoreRootElement) {
        this.root = root;
        this.ops = [];
        this.currentRow = 0;
    }

    public execute() {
        const stdout = this.ops.join("");
        if (stdout) {
            this.root.stdout.write(stdout);
        }
        this.clearOps();
    }

    /**
     * Clear the saved operations.
     * */
    public clearOps() {
        this.ops.length = 0;
    }

    /**
     * Batch any output strings such as `<content>\n<content>\n`.  In order for
     * the terminal to properly scroll, we should include \n as delimiters between
     * rows.  Therefore we should track how many \n the string contains so that
     * we can adjust our `currentRow` accordingly.
     */
    public pushStdout(stdout: string, newLines: number) {
        this.currentRow = Math.min(this.root.stdout.rows - 1, this.currentRow + newLines);
        this.ops.push(stdout);
    }
    /**
     * Batch any Ansi sequences so that they can be flushed along with any output
     * at once.
     * */
    protected pushAnsi(ansi: string) {
        this.ops.push(ansi);
    }

    /** Move to col 0 of row */
    public moveToRow(row: number): void {
        const diff = this.currentRow - row;
        if (diff === 0) {
            this.moveToCol(0);

            return;
        }

        if (diff > 0) {
            this.rowsUp(diff);
        } else {
            this.rowsDown(Math.abs(diff));
        }
    }

    /** Move to col 0 of the next row up - `\x1b[<rows>F` */
    public rowsUp(rows: number): void {
        if (rows <= 0) return;

        this.updateCurrentRow(-rows);
        this.pushAnsi(Ansi.cursor.prevLine(rows));
    }

    /** Move to col 0 of the next row down - `\x1b[<rows>E` */
    public rowsDown(rows: number): void {
        if (rows <= 0) return;

        this.updateCurrentRow(rows);
        this.pushAnsi(Ansi.cursor.nextLine(rows));
    }

    /**
     * Move cursor to col - `\x1b[<columns>G`
     * */
    public moveToCol(col: number): void {
        this.pushAnsi(Ansi.cursor.moveToCol(col));
    }

    /** Clear rest of line from cursor column. */
    public clearFromCursor() {
        this.pushAnsi(Ansi.clear.fromCursorToEdge);
    }

    /** Provide a negative number when the current row has moved **UP**. */
    protected updateCurrentRow(displacement: number) {
        this.currentRow = Math.max(0, this.currentRow + displacement);
    }

    /** Show or hide the cursor */
    public show(b: boolean): void {
        this.pushAnsi(b ? Ansi.cursor.show : Ansi.cursor.hide);
        this.execute();
    }

    /** Clear rows up and execute the operation */
    public clearRowsUp(n: number) {
        if (n <= 0) return;

        this.moveToCol(0);

        let i = n;
        while (i--) {
            this.clearFromCursor();

            if (i !== 0) {
                this.rowsUp(1);
            }
        }

        this.execute();
    }

    /**
     * Clears everything from cursor to end of screen, but does not move cursor.
     * Immediately executes the operation (does not batch).
     */
    public clearRowsBelow() {
        this.pushAnsi(Ansi.clear.display);
        this.execute();
    }
}

export class DebugCursor extends Cursor {
    constructor(root: CoreRootElement) {
        super(root);

        const nextOp = (buf: Buffer) => {
            const str = buf.toString("utf8");
            if (buf[0] === 3 || str === "q") {
                process.stdout.write("\n");
                process.exit();
            }
            if (str !== "n") return;

            const next = this.ops.shift();
            if (next !== undefined) {
                process.stdout.write(next);
            }
        };

        process.stdin.setRawMode(true);
        process.stdin.on("data", nextOp);
    }

    override execute() {}
    override clearOps() {}

    public override pushStdout(stdout: string, newLines: number) {
        logger.write("pushStdout", { stdout, newLines });
        super.pushStdout(stdout, newLines);
    }
    protected override pushAnsi(ansi: string) {
        logger.write("pushAnsi");
        super.pushAnsi(ansi);
    }
    public override moveToRow(row: number): void {
        logger.write("moveToRow", { row, currentRow: this.currentRow });
        super.moveToRow(row);
    }
    public override rowsUp(rows: number): void {
        logger.write("rowsUp", { rows });
        super.rowsUp(rows);
    }
    public override rowsDown(rows: number): void {
        logger.write("rowsDown", { rows });
        super.rowsDown(rows);
    }
    public override moveToCol(col: number): void {
        logger.write("moveToCol", { col });
        super.moveToCol(col);
    }
    public override clearFromCursor() {
        logger.write("clearFromCursor");
        super.clearFromCursor();
    }
    protected override updateCurrentRow(displacement: number) {
        logger.write("updateCurrentRow", { displacement });
        super.updateCurrentRow(displacement);
    }
    public override show(b: boolean): void {
        logger.write("show cursor", { show: b });
        super.show(b);
    }
    public override clearRowsUp(n: number) {
        logger.write("clearRowsUp", { rows: n });
        super.clearRowsUp(n);
    }
    public override clearRowsBelow() {
        logger.write("clearRowsBelow");
        super.clearRowsBelow();
    }
}
