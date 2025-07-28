import { Canvas } from "./Canvas.js";
import { createGlyphManager, Glyph, GlyphManager } from "./Glyph.js";

export type PenConfig = {
    /**
     * Does the pen inherit the last pens position? Or does it reset to the
     * corner position?
     *
     * @default false
     * */
    linked?: boolean;
    canvas: Canvas;
    pos: Canvas["pos"];
};

export class Pen {
    /** Reference to the canvas position, so that linked pens can start off where others leave off */
    private pos: Canvas["pos"];
    private linked: PenConfig["linked"];
    private localPos: Canvas["pos"];
    private max: Canvas["pos"];
    private corner: Canvas["corner"];
    private grid: Canvas["grid"];
    private glyph: Glyph;
    public set: GlyphManager;

    constructor(opts: PenConfig) {
        this.pos = opts.pos;
        this.linked = opts.linked ?? false;
        this.grid = opts.canvas.grid;
        this.corner = opts.canvas.corner;
        this.max = {
            x: this.corner.x + opts.canvas.width - 1,
            y: this.corner.y + opts.canvas.height - 1,
        };

        if (this.linked) {
            this.localPos = { ...this.pos };
        } else {
            this.localPos = { x: opts.canvas.corner.x, y: opts.canvas.corner.y };
        }

        this.glyph = new Glyph({});
        this.set = createGlyphManager(this.glyph, this);
    }

    private pushRowsUntil = (y: number): void => {
        if (this.grid.length - 1 >= this.max.y) return;

        while (!this.grid[y]) {
            this.grid.push(
                Array.from({ length: process.stdout.columns }).fill(" ") as string[],
            );
        }
    };

    public moveTo = (x: number, y: number): Pen => {
        this.pos.x = this.corner.x + x;
        this.pos.y = this.corner.y + y;
        this.localPos = { ...this.pos };
        return this;
    };

    public move = (dir: "U" | "D" | "L" | "R", units: number): Pen => {
        if (dir === "U") this.pos.y -= units;
        if (dir === "D") this.pos.y += units;
        if (dir === "L") this.pos.x -= units;
        if (dir === "R") this.pos.x += units;
        return this;
    };

    public draw = (char: string, dir: "U" | "D" | "L" | "R", units: number): Pen => {
        if (char === "") return this;

        const ansi = this.glyph.open();

        let dx = 0;
        let dy = 0;

        if (dir === "U") dy = -1;
        if (dir === "D") dy = 1;
        if (dir === "L") dx = -1;
        if (dir === "R") dx = 1;

        let { x, y } = this.localPos;

        for (let i = 0; i < units; ++i) {
            if (this.grid[y] === undefined && y <= this.max.y) {
                this.pushRowsUntil(y);
            }

            if (this.grid[y]?.[x] !== undefined) {
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
        this.localPos = { ...this.pos };

        return this;
    };
}
