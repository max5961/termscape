import ansi from "ansi-escape-sequences";
import type { AnsiStyle, BgColor, Color, TextEffect } from "../types.js";
import { DIM_COLOR } from "../util/dimColor.js";
import { Pen } from "./Pen.js";
import { TextEffectSet } from "../constants.js";

export type GlyphConfig = {
    color?: Color;
    bgColor?: BgColor;
    dimColor?: boolean;
    effects?: Partial<Record<TextEffect, boolean>>;
};

export class Glyph {
    public color: GlyphConfig["color"];
    public bgColor: GlyphConfig["bgColor"];
    public dimColor: GlyphConfig["dimColor"];
    public effects: Exclude<GlyphConfig["effects"], undefined>;

    constructor(c: GlyphConfig = {}) {
        this.color = c.color;
        this.bgColor = c.bgColor;
        this.dimColor = c.dimColor ?? false;
        this.effects = c.effects ?? {};
    }

    public open(char: string) {
        const styles: AnsiStyle[] = [];

        if (this.color) styles.push(this.color);
        if (this.bgColor) styles.push(this.bgColor);
        const dimAnsi = this.dimColor ? DIM_COLOR : "";

        for (const [k, v] of Object.entries(this.effects)) {
            if (v) styles.push(k as TextEffect);
        }

        return ansi.styles(styles) + dimAnsi + char;
    }

    public close(char: string) {
        return char + ansi.style.reset;
    }

    public reset() {
        this.color = undefined;
        this.bgColor = undefined;
        this.dimColor = false;
        this.effects = {};
    }

    /** noop - todo */
    private hexAnsi(hex: string) {
        return "";
    }

    /** noop - todo */
    private rgbAnsi(rgb: string) {
        return "";
    }

    /** noop - todo */
    private hslAnsi(hsl: string) {
        return "";
    }
}

export type GlyphManager = ReturnType<typeof createGlyphManager>;

export function createGlyphManager(glyph: Glyph, pen: Pen) {
    return new Proxy(
        {
            color: (val: GlyphConfig["color"]) => pen,
            bgColor: (val: GlyphConfig["bgColor"]) => pen,
            bold: (val: boolean) => pen,
            italic: (val: boolean) => pen,
            imageNegative: (val: boolean) => pen,
            imagePositive: (val: boolean) => pen,
            font1: (val: boolean) => pen,
            font2: (val: boolean) => pen,
            font3: (val: boolean) => pen,
            font4: (val: boolean) => pen,
            font5: (val: boolean) => pen,
            font6: (val: boolean) => pen,
            fontDefault: (val: boolean) => pen,
            dimColor: (val: boolean) => pen,
        },
        {
            get(_, p) {
                if (TextEffectSet.has(p as TextEffect)) {
                    return (val: boolean) => {
                        glyph.effects[p as TextEffect] = val ?? false;
                    };
                }
                if (p === "color") {
                    return (val: GlyphConfig["color"]) => {
                        glyph.color = val;
                    };
                }
                if (p === "bgColor") {
                    return (val: GlyphConfig["bgColor"]) => {
                        glyph.bgColor = val;
                    };
                }
                if (p === "dimColor") {
                    return (val: GlyphConfig["dimColor"]) => {
                        glyph.dimColor = val ?? false;
                    };
                }

                return undefined;
            },
        },
    );
}
