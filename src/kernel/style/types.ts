import type { Borders } from "../../shared/Boxes.js";

export type Shorthand<T> = [T] | [T, T] | [T, T, T] | [T, T, T, T];
export type BorderStyle = keyof typeof Borders;
