export function alignText(
    wrapped: string[],
    width: number,
    align: "left" | "center" | "right",
) {
    if (align === "left") {
        return wrapped;
    }

    if (align === "center") {
        return wrapped.map((r) => {
            const dif = width - r.length;
            if (!dif) return r;

            const left = Math.floor(dif / 2);
            const right = dif - left;

            return " ".repeat(left) + r + " ".repeat(right);
        });
    }

    return wrapped.map((r) => {
        const dif = r.length - width;
        if (!dif) return r;
        return " ".repeat(dif) + r;
    });
}
