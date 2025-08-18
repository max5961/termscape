import type { AnsiStyle, BgColor, Color, TextEffect } from "../Types.js";
import { TextEffectSet } from "../Constants.js";
import { Ansi } from "../shared/Ansi.js";
import { Pen } from "./Pen.js";

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

    public open() {
        const styles: AnsiStyle[] = [];

        if (this.color) styles.push(this.color);
        if (this.bgColor) styles.push(this.bgColor);
        const dimAnsi = this.dimColor ? Ansi.dimColor : "";

        for (const [k, v] of Object.entries(this.effects)) {
            if (v) styles.push(k as TextEffect);
        }

        return Ansi.styles(styles) + dimAnsi;
    }

    public close() {
        return Ansi.style.reset;
    }

    public reset() {
        this.color = undefined;
        this.bgColor = undefined;
        this.dimColor = false;
        this.effects = {};
    }

    /** noop - todo */
    private hexAnsi(_hex: string) {
        return "";
    }

    /** noop - todo */
    private rgbAnsi(_rgb: string) {
        return "";
    }

    /** noop - todo */
    private hslAnsi(_hsl: string) {
        return "";
    }
}

export type GlyphManager = ReturnType<typeof createGlyphManager>;

export function createGlyphManager(glyph: Glyph, pen: Pen) {
    return new Proxy(
        {
            color: (_val: GlyphConfig["color"]) => pen,
            bgColor: (_val: GlyphConfig["bgColor"]) => pen,
            bold: (_val: boolean) => pen,
            italic: (_val: boolean) => pen,
            imageNegative: (_val: boolean) => pen,
            imagePositive: (_val: boolean) => pen,
            font1: (_val: boolean) => pen,
            font2: (_val: boolean) => pen,
            font3: (_val: boolean) => pen,
            font4: (_val: boolean) => pen,
            font5: (_val: boolean) => pen,
            font6: (_val: boolean) => pen,
            fontDefault: (_val: boolean) => pen,
            dimColor: (_val: boolean) => pen,
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
