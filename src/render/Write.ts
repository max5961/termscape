import { WriteAnsi } from "./WriteAnsi.js";

/**
 * - `currentRow` is agnostic of the actual position within the terminal.
 * - It's row before the first pushOutput is considered `0`.
 * - After each pushOutput, the cursor will be set to the end of the lowest line to
 *   allow for seamless integration after the process exits.
 * - The row position will be calculated based on the ANSI escape codes sent to
 *   move the cursor and clear rows, as well as the height of the grid received
 *   to pushOutput to.
 */
export class Write {
    private last: string[][];
    private ansi: WriteAnsi;

    constructor() {
        this.last = [];
        this.ansi = new WriteAnsi({ batch: true, debug: false });
    }

    public writeToStdout(next: string[][]) {
        this.clearLostRows(next);

        /** maps dirty row #s to the index where there is a diff */
        const dirtyRows = [] as number[];

        for (let y = 0; y < next.length; ++y) {
            // `next` has new rows
            if (this.last[y] === undefined) {
                dirtyRows.push(y);
                continue;
            }

            for (let x = 0; x < next[y].length; ++x) {
                if (next[y][x] !== this.last[y][x]) {
                    dirtyRows.push(y);
                    break;
                }
            }
        }

        dirtyRows.forEach((row) => {
            this.ansi.moveToRow(row);
            this.ansi.clearFromCursor();

            const output = next[row].join("");
            this.ansi.pushOutput(output);
        });

        this.ansi.moveToRow(next.length - 1);
        this.ansi.execute();
        this.last = next;
    }

    private clearLostRows(next: string[][]) {
        const diff = this.last.length - next.length;
        if (diff <= 0) return;

        for (let i = 0; i < diff; ++i) {
            this.ansi.moveToRow(this.last.length - 1 - i);
            this.ansi.clearFromCursor();
        }
    }
}
