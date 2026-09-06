const whitespace = new Set([" "]);
const breaks = new Set(["\n", "\r"]);
const nonword = new Set([...whitespace.values(), ...breaks.values(), "\t"]);

const find = (cb: (s: string) => boolean) => (text: string, i: number) => {
    // eslint-disable-next-line no-empty
    while (cb(text[++i]) && text[i]) {}
    return i;
};
const findWord = find((s) => !nonword.has(s));
const findWs = find((s) => whitespace.has(s));
const findBreaks = find((s) => breaks.has(s));

export function textWrap(text: string, width: number, tabWidth = 4) {
    // if width is ever truly 0, then yoga should measure simply based on the
    // length of the string (adjusted for tab characters) instead of calling this fn
    if (!width) {
        return text.split("");
    }

    const rows: string[] = [];

    let current = "";
    let i = 0;
    while (i < text.length) {
        // first we user helper functions to forward track to get the end index
        // of the next chunk

        let j = i;
        if (whitespace.has(text[i])) {
            j = findWs(text, i);
        } else if (breaks.has(text[i])) {
            j = findBreaks(text, i);
            while (i < j) {
                ++i;
                rows.push(current);
                current = "";
            }
            continue;
        } else if (text[i] === "\t") {
            j = i + 1;
        } else {
            j = findWord(text, i);
        }

        // generate a token out of the current slice and bump up i
        let token = text.slice(i, j);
        i = j;

        // tabs currently work for *most* cases, but will need special handling to
        // protect against edge case failures
        if (token === "\t") {
            token = " ".repeat(tabWidth);
        }

        // we need to have a separate case for when this is whitespace and that
        // should help some of the tab edge case failures as well
        if (token.length > width) {
            i -= token.length;
            if (current.length) rows.push(current);
            current = "";
            let k = 0;
            let t = width;
            while (k * width < token.length) {
                const slice = token.slice(k * width, t);
                i += slice.length;

                if (slice.length === width) {
                    rows.push(slice);
                    t += width;
                    ++k;
                } else {
                    current = slice;
                    break;
                }
            }

            continue;
        }

        if (current.length + token.length === width) {
            rows.push(current + token);
            current = "";
            continue;
        }

        if (whitespace.has(token[0]) && current.length + token.length > width) {
            const dif = width - current.length;
            const left = token.slice(0, dif);
            rows.push(current + left);
            current = token.slice(dif);
            continue;
        }

        if (current.length + token.length > width) {
            rows.push(current);
            current = token;
            continue;
        }
        current += token;
    }

    if (current || breaks.has(text[text.length - 1])) {
        rows.push(current);
    }

    return rows;
}

// CASES:
// - current row + token length > width
//      ---> push current row
// - current row + token length <= width
//      ---> update current row && continue
// - token length > width
//      ---> split token, update current row with left split and push current row
//           ensure next iteration token uses right split
