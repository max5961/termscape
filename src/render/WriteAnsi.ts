import ansi from "ansi-escape-sequences";

export class WriteAnsi {
    private batch: boolean;
    private debug: boolean;
    private sequence: string[];
    public currentRow: number;

    constructor({ batch, debug }: { batch?: boolean; debug?: boolean }) {
        this.batch = batch ?? true;
        this.debug = debug ?? false;
        this.sequence = [];
        this.currentRow = 0;

        if (this.debug) {
            process.stdin.setRawMode(true);
            process.stdin.on("data", (data) => data[0] === 3 && process.exit());
        }
    }

    public execute(): void {
        const stdout = this.sequence.join("");
        if (stdout && this.batch) {
            process.stdout.write(stdout);
            this.sleepSync();
        }
        this.sequence = [];
    }

    public pushOutput(stdout: string): void {
        this.sequence.push(stdout);
        if (!this.batch) {
            process.stdout.write(stdout);
            this.sleepSync();
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
        this.sequence.push(ansi.cursor.previousLine(rows));
        if (!this.batch) {
            process.stdout.write(ansi.cursor.previousLine(rows));
            this.sleepSync();
        }
    }

    /** Move to col 0 of the next row down - `\x1b[<rows>E` */
    public rowsDown(rows: number): void {
        if (rows <= 0) return;
        this.updateCurrentRow(rows);
        this.sequence.push(ansi.cursor.nextLine(rows));
        if (!this.batch) {
            process.stdout.write(ansi.cursor.nextLine(rows));
            this.sleepSync();
        }
    }

    /** Move cursor to col - `\x1b[<columns>G` */
    public moveToCol(col: number): void {
        this.sequence.push(ansi.cursor.horizontalAbsolute(col));
        if (!this.batch) {
            process.stdout.write(ansi.cursor.horizontalAbsolute(col));
            this.sleepSync();
        }
    }

    /** Clear rest of line from cursor column. */
    public clearFromCursor() {
        this.sequence.push(ansi.erase.inLine(0));
        if (!this.batch) {
            process.stdout.write(ansi.erase.inLine(0));
            this.sleepSync();
        }
    }

    /** Provide a negative number when the current row has moved **UP**. */
    private updateCurrentRow(displacement: number) {
        this.currentRow = Math.max(0, this.currentRow + displacement);
    }

    /** For debug */
    private sleepSync(ms: number = 2000) {
        if (!this.debug) return;

        const start = Date.now();
        let end = Date.now();
        while (end - start < ms) {
            end = Date.now();
        }
    }
}
