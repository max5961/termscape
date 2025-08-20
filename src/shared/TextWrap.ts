import { TEXT_PADDING } from "../Symbols.js";
import type { TextStyle } from "../Types.js";

export function getRows(text: string, width: number): string[] {
    const rows: string[] = [];

    let line = "";
    let word = "";
    for (let i = 0; i < text.length; ++i) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === " " && !line.length && rows.length) {
            continue;
        }

        line += char;
        if (char === " ") {
            word = "";
        } else {
            word += char;
        }

        if (line.length >= width) {
            if (nextChar === " " || nextChar === undefined) {
                word = "";
            }

            const diff = line.length - word.length;
            const stop = diff ? Math.min(width, diff) : width;

            const left = line.slice(0, stop);
            const right = line.slice(stop);

            rows.push(left);
            if (nextChar === " ") {
                line = " ";
                ++i;
            } else {
                line = "";
            }
            word = right;
            line += word;
        }
    }

    if (line.length) {
        rows.push(line);
    }

    return rows.map((row, idx) => {
        if (idx !== 0) {
            return row.trimStart();
        }
        return row;
    });
}

export function alignRows(
    rows: string[],
    width: number,
    align: TextStyle["align"],
): (string | symbol)[][] {
    if (align === "right") {
        return rows.map((row) => {
            row = row.trim();
            const diff = width - row.length;
            const arrRow = row.split("");

            if (diff < 0) {
                return arrRow;
            }

            const leftWs = new Array(diff).fill(TEXT_PADDING);

            return [...leftWs, ...arrRow];
        });
    }

    if (align === "center") {
        return rows.map((row) => {
            row = row.trim();

            const diff = width - row.length;
            const left = Math.floor(diff / 2);
            const right = diff - left;

            const arrRow = row.split("");

            if (diff < 0) {
                return arrRow;
            }

            const leftWs = new Array(left).fill(TEXT_PADDING);
            const rightWs = new Array(right).fill(TEXT_PADDING);

            return [...leftWs, ...arrRow, ...rightWs];
        });
    }

    // Default - 'left'
    return rows.map((row) => row.split(""));
}

export function getAlignedRows(text: string, width: number, align: TextStyle["align"]) {
    const rows = getRows(text, width);
    return alignRows(rows, width, align);
}
