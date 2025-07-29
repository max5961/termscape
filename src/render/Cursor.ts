import ansi from "ansi-escape-sequences";
import fs from "fs";

export class Cursor {
    private debug: boolean;
    private sequence: string[];
    public currentRow: number;

    constructor({ debug }: { debug?: boolean }) {
        this.debug = debug ?? false;
        this.sequence = [];
        this.currentRow = 0;

        if (this.debug) {
            process.stdin.setRawMode(true);
            process.stdin.on("data", (data) => data[0] === 3 && process.exit());
        }
    }

    /** Write the string sequence to stdout */
    public execute(): void {
        const stdout = this.sequence.join("");
        if (stdout) {
            process.stdout.write(stdout);
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
     * Batch any ansi sequences so that they can be flushed along with any output
     * at once.  If debugging, it will be written immediately and `sleepSync` will
     * run to allow for observation.
     * */
    private deferAnsi(stdout: string): void {
        this.sequence.push(stdout);
        if (this.debug) {
            this.performDebug();
        }
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
        if (this.debug) {
            this.performDebug();
        }
    }

    /**
     * Synchronouslys slow things down so that cursor movements and write
     * operations can be observed visually
     * */
    private performDebug() {
        // Execute the the sequence thus far
        this.execute();

        // Log the current row number
        fs.writeFileSync(
            "/home/max/repos/termscape/row.log",
            `[${new Date().getMinutes()}:${new Date().getSeconds()}]${String(this.currentRow)}\n`,
            {
                flag: "a",
                encoding: "utf-8",
            },
        );

        // Synchronously block the operations for DEBUG_MS time.
        const ms = Number(process.env.DEBUG_MS ?? 1000);

        const start = Date.now();
        let end = Date.now();
        while (end - start < ms) {
            end = Date.now();
        }
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
        this.deferAnsi(ansi.cursor.previousLine(rows));
    }

    /** Move to col 0 of the next row down - `\x1b[<rows>E` */
    public rowsDown(rows: number): void {
        if (rows <= 0) return;
        this.updateCurrentRow(rows);
        this.deferAnsi(ansi.cursor.nextLine(rows));
    }

    /**
     * Move cursor to col - `\x1b[<columns>G`
     * [NOTE] - Assume zero based indexing for the column, but in actuality the
     * terminal is 1 based. This fn adds 1 to the col value.
     * */
    public moveToCol(col: number): void {
        this.deferAnsi(ansi.cursor.horizontalAbsolute(col + 1));
    }

    /** Clear rest of line from cursor column. */
    public clearFromCursor() {
        this.deferAnsi(ansi.erase.inLine(0));
    }

    /** Provide a negative number when the current row has moved **UP**. */
    private updateCurrentRow(displacement: number) {
        this.currentRow = Math.max(0, this.currentRow + displacement);
    }

    /** Show or hide the cursor */
    public show(b: boolean): void {
        this.deferAnsi(b ? ansi.cursor.show : ansi.cursor.hide);
        this.execute();
    }

    /** Clear rows up and execute the operation */
    public clearRowsUp = (n: number) => {
        if (n <= 0) return "";

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
}
