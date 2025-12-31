import { ifMut } from "../../Util.js";

export const parseDimensions = (
    dim: string | number | undefined,
    stdout: NodeJS.WriteStream,
    endsWith: "vw" | "vh",
) => {
    return ifMut(dim, (n) => {
        if (typeof n !== "string") return;
        if (n.trimEnd().endsWith(endsWith)) {
            const pct = Number.parseInt(n, 10) / 100;
            return stdout[endsWith === "vh" ? "rows" : "columns"] * pct;
        }
        return;
    });
};
