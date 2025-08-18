export function parseRgb(s: string): [number, number, number] | null {
    const regex = new RegExp(/rgb\s*\(\s*(\d+)\s*,*\s*(\d+)\s*,*\s*(\d+)/gm);
    const matches = regex.exec(s);

    if (matches && matches.length > 3) {
        return matches.filter((m) => !Number.isNaN(Number(m))).map((m) => Number(m)) as [
            number,
            number,
            number,
        ];
    } else {
        return null;
    }
}

// hsl(192 48 76)

export function parseColorNotation(
    s: string,
): ["rgb" | "hsl" | "hsv", number, number, number] | null {
    const regex = new RegExp(/(rgb|hsl|hsv)\s*\(\s*(\d+)\s*,*\s*(\d+)\s*,*\s*(\d+)/gm);
    const matches = regex.exec(s);

    if (matches && matches.length > 4) {
        // @ts-ignore
        return [
            matches[0] as "rgb" | "hsl" | "hsv",
            matches.map((m) => Number(m)).filter((m) => Number.isNaN(m)),
        ].slice(0, 4);
    }

    return null;
}
