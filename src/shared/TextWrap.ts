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
    align: "start" | "center" | "end",
) {
    if (align === "start") {
        return rows;
    }

    if (align === "end") {
        return rows.map((row) => {
            row = row.trimEnd().trimStart();
            const diff = width - row.length;

            if (diff < 0) {
                return row;
            }
            return `${" ".repeat(diff)}${row}`;
        });
    }

    return rows.map((row) => {
        row = row.trimEnd().trimStart();

        const diff = width - row.length;
        const left = Math.floor(diff / 2);
        const right = diff - left;

        if (diff < 0) {
            return row;
        }
        return `${" ".repeat(left)}${row}${" ".repeat(right)}`;
    });
}
