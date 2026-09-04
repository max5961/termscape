import { format } from "node:util";
import fs from "node:fs";
import type { Grid } from "./core/canvas/types.js";
import type { StdoutLike } from "./Types.js";

export type _Omit<T extends object, U extends keyof T> = Omit<T, U>;
export type _Pick<T extends object, U extends keyof T> = Pick<T, U>;
export type _Exclude<T, U extends T> = Exclude<T, U>;
export type _Extract<T, U extends T> = Extract<T, U>;

export function objectKeys<T extends object>(o: T) {
    return Object.keys(o) as (keyof T)[];
}

export function objectEntries<T extends object>(obj: T) {
    return Object.entries(obj) as [keyof T, T[keyof T]][];
}

export function isFullscreen(grid: Readonly<Grid> | undefined, stdout: StdoutLike) {
    return grid && grid.length >= stdout.rows;
}

export const logger = {
    write: (...data: any[]) => {
        if (process.env.NODE_ENV === "production") return;

        const date = new Date();
        const h = date.getHours().toString().padStart(2, "0");
        const m = date.getMinutes().toString().padStart(2, "0");
        const s = date.getSeconds().toString().padStart(2, "0");
        const ms = date.getMilliseconds().toString().padStart(3, "0");

        const formattedData = data.reduce((a, c) => {
            return a ? `${a}, ${format(c)}` : format(c);
        }, "");

        const str = `${h}:${m}:${s}:${ms}: ${formattedData}\n`;
        fs.appendFileSync("console.log", str, {
            encoding: "utf8",
        });
    },
};
