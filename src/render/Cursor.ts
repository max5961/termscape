import ansi from "ansi-escape-sequences";

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
        this.sequence = [];
    }

    /**
     * Batch any ansi sequences or plain output so that it can be flushed all
     * at once.  If debugging, it will be written immediately and `sleepSync` will
     * run to allow for observation.
     * */
    public deferWrite(stdout: string): void {
        if (!this.debug) {
            this.sequence.push(stdout);
        } else {
            process.stdout.write(stdout);
            this.sleepSync();
        }
    }

    /** For debug - to slow things down so that cursor movements can be seen */
    private sleepSync() {
        if (!this.debug) return;
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
        this.deferWrite(ansi.cursor.previousLine(rows));
    }

    /** Move to col 0 of the next row down - `\x1b[<rows>E` */
    public rowsDown(rows: number): void {
        if (rows <= 0) return;
        this.updateCurrentRow(rows);
        this.deferWrite(ansi.cursor.nextLine(rows));
    }

    /**
     * Move cursor to col - `\x1b[<columns>G`
     * [NOTE] - Assume zero based indexing for the column, but in actuality the
     * terminal is 1 based. This fn adds 1 to the col value.
     * */
    public moveToCol(col: number): void {
        this.deferWrite(ansi.cursor.horizontalAbsolute(col + 1));
    }

    /** Clear rest of line from cursor column. */
    public clearFromCursor() {
        this.deferWrite(ansi.erase.inLine(0));
    }

    /** Provide a negative number when the current row has moved **UP**. */
    private updateCurrentRow(displacement: number) {
        this.currentRow = Math.max(0, this.currentRow + displacement);
    }

    /** Show or hide the cursor */
    public show(b: boolean): void {
        this.deferWrite(b ? ansi.cursor.show : ansi.cursor.hide);
    }

    /** Clear rows up and execute the operation */
    public clearRowsUp = (n: number) => {
        if (n <= 0) return "";

        let i = n;
        while (i--) {
            this.rowsUp(1);
            this.clearFromCursor();
        }

        this.execute();
    };
}
