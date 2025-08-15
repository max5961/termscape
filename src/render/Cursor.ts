import { Ansi } from "../util/Ansi.js";
import { logger } from "../logger/Logger.js";

export class Cursor {
    private debug: boolean;
    private sequence: string[];
    private debugseq: { row: number; stdout: string; operation: string }[];
    public currentRow: number;

    constructor({ debug }: { debug?: boolean }) {
        this.debug = debug ?? false;
        this.sequence = [];
        this.debugseq = [];
        this.currentRow = 0;

        if (this.debug) {
            process.stdin.setRawMode(true);
            const nextOperation = (buf: Buffer) => {
                if (buf[0] === 3) process.exit();
                if (buf.toString("utf-8") === "n") {
                    const chunk = this.debugseq.shift();
                    if (chunk !== undefined) {
                        if (chunk.stdout) process.stdout.write(chunk.stdout);
                        logger.write({ row: chunk.row, operation: chunk.operation });
                    }
                }
            };
            process.stdin.on("data", nextOperation);
        }
    }

    /** Write the string sequence to stdout */
    public execute(): void {
        if (!this.debug) {
            const stdout = this.sequence.join("");
            if (stdout) {
                process.stdout.write(stdout);
            }
            this.clearOps();
        }
    }

    private defer(stdout: string) {
        this.sequence.push(stdout);
    }

    private deferDebug(stdout: string, operation: string) {
        this.debugseq.push({
            row: this.currentRow,
            operation,
            stdout,
        });
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
    private deferAnsi(stdout: string): void {
        this.defer(stdout);
        this.deferDebug(stdout, "deferAnsi");
    }

    /**
     * Batch any output strings such as `<content>\n<content>\n`.  In order for
     * the terminal to properly scroll, we should include \n as delimiters between
     * rows.  Therefore we should track how many \n the string contains so that
     * we can adjust our `currentRow` accordingly.
     */
    public deferOutput(stdout: string, newlines: number): void {
        this.currentRow = Math.min(process.stdout.rows - 1, this.currentRow + newlines);
        this.defer(stdout);
        this.deferDebug(stdout, "deferOutput");
    }

    /** Move to col 0 of row */
    public moveToRow(row: number): void {
        const diff = this.currentRow - row;
        if (diff === 0) {
            this.moveToCol(0);
            this.deferDebug("", `moveToRow(${row}) -> moveToCol(0)`);
            return;
        }

        if (diff > 0) {
            this.rowsUp(diff);
            this.deferDebug("", `rowsUp(${diff})`);
        } else {
            this.rowsDown(Math.abs(diff));
            this.deferDebug("", `rowsDown(${Math.abs(diff)})`);
        }
    }

    /** Move to col 0 of the next row up - `\x1b[<rows>F` */
    public rowsUp(rows: number): void {
        if (rows <= 0) return;
        this.deferDebug("", `preRowsUp(${rows})`);
        this.updateCurrentRow(-rows);
        this.deferAnsi(Ansi.cursor.previousLine(rows));
    }

    /** Move to col 0 of the next row down - `\x1b[<rows>E` */
    public rowsDown(rows: number): void {
        if (rows <= 0) return;
        this.deferDebug("", `preRowsDown(${rows})`);
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
    private updateCurrentRow(displacement: number) {
        this.deferDebug("", `pre-updateCurrentRow(${displacement})`);
        this.currentRow = Math.max(0, this.currentRow + displacement);
        this.deferDebug("", `post-updateCurrentRow(${displacement})`);
    }

    /** Show or hide the cursor */
    public show(b: boolean): void {
        this.deferAnsi(b ? Ansi.cursor.show : Ansi.cursor.hide);
        this.execute();
    }

    /** Clear rows up and execute the operation */
    public clearRowsUp = (n: number) => {
        if (n <= 0) return;

        this.deferDebug("", `pre-clearRowsUp(${n})`);

        this.moveToCol(0);

        let i = n;
        while (i--) {
            this.clearFromCursor();

            if (i !== 0) {
                this.rowsUp(1);
            }
        }

        this.deferDebug("", `post-clearRowsUp(${n})`);

        this.execute();
    };
}
