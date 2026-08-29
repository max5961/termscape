import type { Borders } from "../Boxes.js";

export type RequiredPartial<T extends object> = {
    [P in keyof Required<T>]: Required<T>[P] | undefined;
};

export type Shorthand<T> = [T] | [T, T] | [T, T, T] | [T, T, T, T];
export type BorderStyle = keyof typeof Borders;
