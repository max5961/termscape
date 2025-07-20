import chalk from "chalk/index.js";
import { parseRgb } from "../util/parseRgb.js";

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
