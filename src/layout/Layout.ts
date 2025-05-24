import { DomElement } from "../dom/DomElement.js";
import { BoxStyle } from "../dom/elements/attributes/box/BoxStyle.js";
import chalk from "chalk/index.js";
import { parseRgb } from "../util/parseRgb.js";

/*
 * createGetRenderLayer returns a function we will call getRenderLayer which is a
 * recursive factory function that contains an api for drawing to the grid.  On
 * every render a new Layout object is created and getRenderLayer is passed to the
 * recursive renderNode function.  Each new rendered node passed layer.getRenderLayer
 * to its child nodes.
 *
 * Reasons for this:
 * 1. Each node gets an API to draw to the grid that has relevant overflow context
 * so that its easy to keep the draw function from going out of bounds
 * 2. Other context that would be tedious to reset such as pos and increasing the
 * columns is updated automatically.  pos gets set to the TL corner position of
 * the node (layer.moveTo still exists to change that if desired)
 * */
export class Layout {
    private stdout: NodeJS.WriteStream;
    private grid: string[][];
    private pos: { x: number; y: number };

    constructor(stdout: NodeJS.WriteStream) {
        this.stdout = stdout;
        this.pos = { x: 0, y: 0 };
        this.grid = [];
    }

    private pushNewRow(count: number): void {
        for (let i = 0; i < count; ++i) {
            this.grid.push(
                Array.from({ length: this.stdout.columns }).fill(" ") as string[],
            );
        }
    }

    public createGetRenderLayer = (bounds = { x: Infinity, y: Infinity }) => {
        // return getRenderLayer
        return (x: number, y: number, node: DomElement) => {
            // Update the context
            const depth = x + node.node.getComputedHeight();
            const diff = depth - this.grid.length;
            if (diff > 0) this.pushNewRow(diff);

            this.pos.x = x;
            this.pos.y = y;

            // Handle setting local overflow bounds
            const localBounds = { ...bounds };
            const { overflow, overflowX, overflowY } = node.props.style as BoxStyle;
            if (overflow === "hidden") {
                localBounds.x = node.node.getComputedWidth();
                localBounds.y = node.node.getComputedHeight();
            }
            if (overflowX) {
                localBounds.x = overflowX === "visible" ? bounds.x : localBounds.x;
            }
            if (overflowY) {
                localBounds.y = overflowY === "visible" ? bounds.y : localBounds.y;
            }

            // Sets draw start point
            const moveTo = (x: number, y: number): void => {
                this.pos.x = x;
                this.pos.y = y;
            };

            // For when you know the relative way to the target position, but calculating
            // it would be tedious, such as when draw leaves you in an undesirable
            // position for the next draw
            const move = (dir: "U" | "D" | "L" | "R", units: number): void => {
                if (dir === "U") this.pos.y += units;
                if (dir === "D") this.pos.y -= units;
                if (dir === "L") this.pos.x -= units;
                if (dir === "R") this.pos.x += units;
            };

            // Drawing N units in any direction shifts pos N units in that direction.
            // This requires you to move the position after every draw so that
            // the last cell isn't overwritten by the next draw
            const draw = (
                glyph: Glyph,
                dir: "U" | "D" | "L" | "R",
                length: number,
            ): void => {
                const char = glyph.render();

                let dx = 0;
                let dy = 0;
                if (dir === "U") dy = 1;
                if (dir === "D") dy = -1;
                if (dir === "L") dx = -1;
                if (dir === "R") dx = 1;

                let { x, y } = this.pos;

                for (let i = 0; i < length; ++i) {
                    if (x < localBounds.x && y < localBounds.y && this.grid[y]?.[x]) {
                        this.grid[y][x] = char;
                    }

                    if (i !== length - 1) {
                        x += dx;
                        y += dy;
                    }
                }

                this.pos.x = x;
                this.pos.y = y;
            };

            return {
                moveTo,
                move,
                draw,
                getRenderLayer: this.createGetRenderLayer(localBounds),
            };
        };
    };

    public getOutputString(): string {
        // prettier-ignore
        return this.grid
            .map((row) => row.join("").trimEnd() + "\n")
            .join("");
    }

    public writeToStdout(s: string): void {
        this.stdout.write(s);
    }
}

/*
 * layer.draw requires a Glyph to be created.  A Glyph is just an ansi styled (or
 * not styled at all) character, which ends up being inserted into a single grid
 * cell.  This makes sure that the ansi styles dont need to be parsed.
 * */
export class Glyph {
    private char!: string;

    constructor(glyph: GlyphConfig) {
        this.char = this.setGlyph(glyph);
    }

    public setGlyph(glyph: GlyphConfig): string {
        this.char = glyph.char;

        if (glyph.bold) {
            this.char = chalk.bold(this.char);
        }

        if (glyph.dimColor) {
            this.char = chalk.dim(this.char);
        }

        if (glyph.color) {
            const rgb = parseRgb(glyph.color);
            const hex = glyph.color.startsWith("#");

            if (rgb) {
                const gen = chalk.rgb(rgb[0], rgb[1], rgb[2])(this.char);
                if (gen) this.char = gen;
            } else if (hex) {
                const gen = chalk.hex(glyph.color)(this.char);
                if (gen) this.char = gen;
            } else {
                const gen = chalk[glyph.color]?.(this.char);
                if (gen) this.char = gen;
            }
        }

        return this.char;
    }

    public render(): string {
        return this.char;
    }
}
