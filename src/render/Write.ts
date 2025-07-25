import ansi from "ansi-escape-sequences";

/**
 * - `cursorRow` is agnostic of the actual position within the terminal.
 * - It's row before the first write is considered `0`.
 * - After each write, the cursor will be set to the end of the lowest line to
 *   allow for seamless integration after the process exits.
 * - The row position will be calculated based on the ANSI escape codes sent to
 *   move the cursor and clear rows, as well as the height of the grid received
 *   to write to.
 */
export class Write {
    private last: string[][];
    private cursorRow: number;

    constructor() {
        this.cursorRow = 0;
        this.last = [];
    }

    public writeToStdout(next: string[][]) {
        this.eraseRemovedLines(next);

        /** maps dirty row #s to the index where there is a diff */
        const dirtyRows = [] as [number, number][];
        const eraseRest = [] as [number, number][];

        for (let y = 0; y < next.length; ++y) {
            // `next` has new rows
            if (this.last[y] === undefined) {
                dirtyRows.push([y, 0]);
                continue;
            }

            for (let x = 0; x < next[y].length; ++x) {
                const toErase = Math.max(this.last[y].length, 0);
                if (toErase) eraseRest.push([y, next[y].length - 1]);

                // This handles row is longer or just changed, but doesn't handle
                // row is shorter than this.last
                if (next[y][x] !== this.last[y][x]) {
                    dirtyRows.push([y, x]);
                    break;
                }
            }
        }

        eraseRest.forEach(([row, col]) => {
            this.moveToRow(row);
            this.cursorRight(col);
            this.clearLineFromCursor();
        });

        dirtyRows.forEach(([row, col]) => {
            const nl = col < next.length - 1 ? "\n" : "";
            const output = next[row].slice(col).join("") + nl;

            // Move cursor up to where it needs to go
            // Move cursor right where it need to go
            // Clear from cursor to the end of the line
            process.stdout.write(output);
        });
    }

    private moveToRow(n: number): void {
        // Most important function in this API
    }

    private linesUp(lines: number): string {
        this.cursorRow -= lines;
        return ansi.cursor.previousLine(lines);
    }

    private linesDown(lines: number): string {
        this.cursorRow += lines;
        return ansi.cursor.nextLine(lines);
    }

    private cursorRight(cols: number): string {
        return ansi.cursor.forward(cols);
    }

    private clearLineFromCursor() {
        return ansi.erase.inLine(0);
    }

    private eraseRemovedLines(next: string[][]) {
        const toErase = Math.max(this.last.length - next.length, 0);
        let eraseAnsi = "";
        for (let i = 0; i < toErase; ++i) {
            eraseAnsi += this.linesUp(1) + this.clearLineFromCursor();
        }
        process.stdout.write(eraseAnsi);
    }
}
