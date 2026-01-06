import type { Root } from "../dom/RootElement.js";
import { logger } from "../shared/Logger.js";
import { Ansi } from "../shared/Ansi.js";

export class Cursor {
    protected _root: Root;
    protected _sequence: string[];
    protected _currentRow: number;

    constructor(root: Root) {
        this._root = root;
        this._sequence = [];
        this._currentRow = 0;
    }

    /** Write the string sequence to stdout */
    public execute(): void {
        const stdout = this._sequence.join("");
        if (stdout) {
            this._root.runtime.stdout.write(stdout);
        }
        this.clearOps();
    }

    /**
     * Clear the saved operations. If not for clearing the sequences after a render,
     * the next render would include the previous operations.
     * */
    public clearOps(): void {
        this._sequence = [];
    }

    /**
     * Batch any Ansi sequences so that they can be flushed along with any output
     * at once.  If debugging, it will be written immediately and `sleepSync` will
     * run to allow for observation.
     * */
    protected deferAnsi(ansi: string): void {
        this._sequence.push(ansi);
    }

    /**
     * Batch any output strings such as `<content>\n<content>\n`.  In order for
     * the terminal to properly scroll, we should include \n as delimiters between
     * rows.  Therefore we should track how many \n the string contains so that
     * we can adjust our `currentRow` accordingly.
     */
    public deferOutput(stdout: string, newlines: number): void {
        this._currentRow = Math.min(process.stdout.rows - 1, this._currentRow + newlines);
        this._sequence.push(stdout);
    }

    /** Move to col 0 of row */
    public moveToRow(row: number): void {
        const diff = this._currentRow - row;
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
        this._currentRow = Math.max(0, this._currentRow + displacement);
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

            logger.write(this._sequence.length);

            const chunk = this._sequence.shift();
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
