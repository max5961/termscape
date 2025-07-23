import ansi from "ansi-escape-sequences";
import { Color } from "../util/types.js";

export type GlyphConfig = {
    color?: Color;
    backgroundColor?: Color;
    bold?: boolean;
    dimColor?: boolean;
};

export class Glyph {
    public color?: Color;
    public backgroundColor?: Color;
    public bold?: boolean;
    public dimColor?: boolean;

    constructor(c: GlyphConfig) {
        this.color = c.color ?? undefined;
        this.backgroundColor = c.backgroundColor ?? undefined;
        this.bold = c.bold ?? false;
        this.dimColor = c.dimColor ?? false;
    }

    public open() {
        // @ts-expect-error fuck you
        const color = ansi.style[this.color ?? ""] ?? "";
        // @ts-expect-error fuck you
        const bgColor = ansi.style[this.backgroundColor ?? ""] ?? "";

        return color + bgColor;
    }

    public close() {
        return ansi.style.reset;
    }

    public reset() {
        this.color = undefined;
        this.backgroundColor = undefined;
        this.bold = false;
        this.dimColor = false;
    }
}
