import type { Root } from "../dom/Root.js";
import { logger } from "../shared/Logger.js";
import { Ansi } from "../shared/Ansi.js";

export class Cursor {
    protected root: Root;
    protected sequence: string[];
    public currentRow: number;

    constructor(root: Root) {
        this.root = root;
        this.sequence = [];
        this.currentRow = 0;
    }

    /** Write the string sequence to stdout */
    public execute(): void {
        const stdout = this.sequence.join("");
        if (stdout) {
            this.root.runtime.stdout.write(stdout);
        }
        this.clearOps();
    }

    /**
     * Clear the saved operations.  Useful for when last stdout === prev stdout
     * during a full rewrite.  If we didn't clear the sequences, then next render
     * we would be writing the previous operations we didn't want.
     * */
    public clearOps(): void {
        this.sequence = [];
    }

    /**
     * Batch any Ansi sequences so that they can be flushed along with any output
     * at once.  If debugging, it will be written immediately and `sleepSync` will
     * run to allow for observation.
     * */
    protected deferAnsi(ansi: string): void {
        this.sequence.push(ansi);
    }

    /**
     * Batch any output strings such as `<content>\n<content>\n`.  In order for
     * the terminal to properly scroll, we should include \n as delimiters between
     * rows.  Therefore we should track how many \n the string contains so that
     * we can adjust our `currentRow` accordingly.
     */
    public deferOutput(stdout: string, newlines: number): void {
        this.currentRow = Math.min(process.stdout.rows - 1, this.currentRow + newlines);
        this.sequence.push(stdout);
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
        this.deferAnsi(Ansi.cursor.previousLine(rows));
    }

    /** Move to col 0 of the next row down - `\x1b[<rows>E` */
    public rowsDown(rows: number): void {
        if (rows <= 0) return;

        this.updateCurrentRow(rows);
        this.deferAnsi(Ansi.cursor.nextLine(rows));
    }

    /**
     * Move cursor to col - `\x1b[<columns>G`
     * [NOTE] - Assume zero based indexing for the column, but in actuality the
     * terminal is 1 based. This fn adds 1 to the col value.
     * */
    public moveToCol(col: number): void {
        this.deferAnsi(Ansi.cursor.horizontalAbsolute(col + 1));
    }

    /** Clear rest of line from cursor column. */
    public clearFromCursor() {
        this.deferAnsi(Ansi.erase.inLine(0));
    }

    /** Provide a negative number when the current row has moved **UP**. */
    protected updateCurrentRow(displacement: number) {
        this.currentRow = Math.max(0, this.currentRow + displacement);
    }

    /** Show or hide the cursor */
    public show(b: boolean): void {
        this.deferAnsi(b ? Ansi.cursor.show : Ansi.cursor.hide);
        this.execute();
    }

    /** Clear rows up and execute the operation */
    public clearRowsUp = (n: number) => {
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
    };

    /**
     * Clears everything from cursor to end of screen, but does not move cursor.
     * Immediately executes the operation (does not batch).
     */
    public clearRowsBelow = () => {
        this.deferAnsi(Ansi.eraseDisplay);
        this.execute();
    };
}

export class DebugCursor extends Cursor {
    constructor(root: Root) {
        super(root);

        const nextOperation = (buf: Buffer) => {
            if (buf[0] === 3) process.exit();
            if (buf.toString("utf-8") !== "n") return;

            const chunk = this.sequence.shift();
            if (chunk !== undefined) {
                process.stdout.write(chunk);
                logger.write({ chunk });
            }
        };

        process.stdin.setRawMode(true);
        process.stdin.on("data", nextOperation);
    }

    public override execute() {}
    public override clearOps() {}
}
