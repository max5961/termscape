import type { Point } from "../../Types.js";

export type Rect = {
    corner: Point;
    height: number;
    width: number;
};

export type PenLimits = {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
};

export type GridToken = {
    ansi: string;
    char: string;
    charWidth: number;
};

export type Grid = (string | GridToken)[][];
