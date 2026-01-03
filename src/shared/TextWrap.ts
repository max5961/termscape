import { TEXT_PADDING, HIDDEN_TRIMMED_WS } from "../Constants.js";
import type { Style } from "../dom/style/Style.js";

export function getRows(
    text: string,
    width: number,
    tracker?: { idx: number },
    stopRows?: number,
): string[] {
    if (!text) return [];
    if (width <= 0) return text.split("");

    const result: string[] = [];

    let line = "";
    for (let i = 0; i < text.length; ++i) {
        const char = text[i];

        if (shouldTreatAsBreak(char)) {
            result.push(line);
            line = "";
        } else if (char === "\t") {
            text = text.slice(0, i) + "    " + text.slice(i + 1);
            --i;
            continue;
        } else if (char === " ") {
            line += " ";
        } else {
            line += char;
        }

        if (line.length > width) {
            // line break is breaking a word
            if (!line.endsWith(" ")) {
                const breakIdx = findBreakIdx(line);
                const left = line.slice(0, breakIdx);
                const right = line.slice(breakIdx);
                if (left) result.push(left);
                line = right;
            } else {
                const left = line.slice(0, line.length - 1);
                const right = line.slice(line.length - 1);
                if (left) result.push(left);
                line = right;
            }
        }

        if (stopRows && result.length >= stopRows) {
            if (line) result.push(line);
            return result;
        }

        if (tracker) tracker.idx = i;
    }

    if (line) result.push(line);

    const lastChar = text[text.length - 1];
    if (lastChar && shouldTreatAsBreak(lastChar)) result.push("");

    return result;
}

export function alignRows(
    rows: string[],
    width: number,
    align: Style.Text["align"],
): (string | symbol)[][] {
    if (align === "right") {
        return rows.map((row) => {
            // If ws only, choose to place all hidden trimmed ws to the right
            const wsOnly = hasOnlyWs(row);

            const removedLeft = wsOnly ? 0 : row.length - row.trimStart().length;
            const removedRight = row.length - row.trimEnd().length;
            row = row.trim();
            const pad = width - row.length;

            return [
                ...fillWith(pad, TEXT_PADDING),
                ...fillWith(removedLeft, HIDDEN_TRIMMED_WS),
                ...row.split(""),
                ...fillWith(removedRight, HIDDEN_TRIMMED_WS),
            ];
        });
    }

    if (align === "center") {
        return rows.map((row) => {
            // If ws only, choose to place hidden trimmed ws on right (will still be left of right padding)
            const wsOnly = hasOnlyWs(row);

            const removedLeft = wsOnly ? 0 : row.length - row.trimStart().length;
            const removedRight = row.length - row.trimEnd().length;
            row = row.trim();
            const pad = width - row.length;
            const padLeft = Math.floor(pad / 2);
            const padRight = Math.ceil(pad / 2);

            return [
                ...fillWith(padLeft, TEXT_PADDING),
                ...fillWith(removedLeft, HIDDEN_TRIMMED_WS),
                ...row.split(""),
                ...fillWith(removedRight, HIDDEN_TRIMMED_WS),
                ...fillWith(padRight, TEXT_PADDING),
            ];
        });
    }

    // Default - 'left'
    return rows.map((row) => row.split(""));
}

export function getAlignedRows(text: string, width: number, align: Style.Text["align"]) {
    const rows = getRows(text, width);
    return alignRows(rows, width, align);
}

export function shouldTreatAsBreak(char: string) {
    if (char === "\t") return false;

    const charCode = char.charCodeAt(0);

    if (charCode < 32) {
        return true;
    }

    if (charCode >= 127 && charCode <= 159) {
        return true;
    }

    if (charCode === 8232 || charCode === 8233) {
        return true;
    }

    return false;
}

function findBreakIdx(line: string): number {
    let breakIdx = line.length;
    while (--breakIdx >= 0) {
        if (line[breakIdx] == " ") {
            ++breakIdx;
            break;
        }
    }
    return breakIdx;
}

function fillWith<T extends string | symbol>(
    length: number,
    char: T,
): T extends string ? string[] : symbol[] {
    if (length <= 0) return [];
    return Array.from({ length }).fill(char) as T extends string ? string[] : symbol[];
}

function hasOnlyWs(s: string) {
    return !s.match(/[^\s]/m);
}
