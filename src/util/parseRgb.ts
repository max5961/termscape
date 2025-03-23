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
