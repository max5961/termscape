import type { Point } from "../../Types.js";
import { PenStyle } from "./PenStyle.js";
import type { Canvas } from "./Canvas.js";
import type { Grid } from "./types.js";
import type { ITextStyle } from "../style/IStyle.js";

type Direction = "u" | "d" | "l" | "r";

export class Pen {
    private readonly grid: Grid;
    private readonly canvas: Canvas;
    private readonly pos: Point;
    private readonly penStyle: PenStyle;

    constructor(canvas: Canvas) {
        this.canvas = canvas;
        this.grid = canvas.grid;
        this.pos = { ...this.canvas.corner };
        this.penStyle = new PenStyle();
    }

    public setStyle(style: ITextStyle) {
        this.penStyle.style = style;
        return this;
    }

    public reset() {
        this.penStyle.resetStyle();
        this.pos.x = this.canvas.corner.x;
        this.pos.y = this.canvas.corner.y;
    }

    public draw = (char: string, dir: Direction, units: number): Pen => {
        if (char === "") return this;
        if (char === undefined) throw new Error("char cannot be undefined you bozo");

        const ansi = this.penStyle.getAnsi();

        let dx = 0;
        let dy = 0;
        if (dir === "u") dy = -1;
        else if (dir === "d") dy = 1;
        else if (dir === "l") dx = -1;
        else if (dir === "r") dx = 1;

        let { x, y } = this.pos;

        for (let i = 0; i < units; ++i) {
            if (this.isValidCell(x, y)) {
                if (ansi) {
                    this.grid[y][x] = { ansi, char, charWidth: 1 };
                } else {
                    this.grid[y][x] = char;
                }
            }

            x += dx;
            y += dy;
        }

        this.pos.x = x;
        this.pos.y = y;

        return this;
    };

    /**
     * Moves to a position **relative** to the current position.
     * */
    public move = (dir: Direction, units: number): Pen => {
        if (dir === "u") this.pos.y -= units;
        else if (dir === "d") this.pos.y += units;
        else if (dir === "l") this.pos.x -= units;
        else if (dir === "r") this.pos.x += units;
        return this;
    };

    /**
     * Moves pos to a point *relative* to the corner of the canvas
     * */
    public moveTo = (x: number, y: number) => {
        this.pos.x = this.canvas.corner.x + x;
        this.pos.y = this.canvas.corner.y + y;
    };

    public moveToCorner = (corner: "tl" | "tr" | "bl" | "br") => {
        if (corner === "tl") {
            this.pos.x = this.canvas.corner.x;
            this.pos.y = this.canvas.corner.y;
        } else if (corner === "tr") {
            this.pos.y = this.canvas.corner.y;
            this.pos.x = this.canvas.corner.x + this.canvas.ygWidth;
        } else if (corner === "bl") {
            this.pos.x = this.canvas.corner.x;
            this.pos.y = this.canvas.corner.y = this.canvas.ygHeight;
        } else if (corner === "br") {
            this.pos.x = this.canvas.corner.x + this.canvas.ygWidth;
            this.pos.y = this.canvas.corner.y + this.canvas.ygHeight;
        }
    };

    private isValidCell = (x: number, y: number) => {
        if (this.grid[y] === undefined || this.grid[y][x] === undefined) {
            return false;
        }

        if (x < this.canvas.limits.minX) return false;
        if (y < this.canvas.limits.minY) return false;
        if (x >= this.canvas.limits.maxX) return false;
        if (y >= this.canvas.limits.maxY) return false;

        return true;
    };
}
