import { objectKeys } from "../../util.js";
import { Ansi } from "../Ansi.js";
import type { Color } from "../../Types.js";
import type { IAnsiEffectStyle } from "../style/IStyle.js";

const colorToAnsi = toAnsi(Ansi.rgb);
const backgroundColorToAnsi = toAnsi(Ansi.backgroundRgb);

export class PenStyle {
    private prevAnsi: string | undefined;

    private _style: IAnsiEffectStyle = {};
    public get style() {
        this.prevAnsi = undefined;
        return this._style;
    }
    public set style(style) {
        this.prevAnsi = undefined;
        this._style = style;
    }

    public resetStyle() {
        this.prevAnsi = undefined;
        this._style = {};
    }

    public getAnsi() {
        if (this.prevAnsi) return this.prevAnsi;
        this.prevAnsi = this.toString(this._style);
        return this.prevAnsi;
    }

    public toString(style: IAnsiEffectStyle) {
        let res = "";
        for (const key of objectKeys(style)) {
            if (key === "color") {
                res += colorToAnsi(style[key]);
            } else if (key === "backgroundColor") {
                res += backgroundColorToAnsi(style[key]);
            } else if (style[key] && Ansi.effects[key]) {
                res += Ansi.effects[key];
            }
        }
        return res;
    }
}

function toAnsi(rgbConverter: typeof Ansi.rgb) {
    return (color: string | Color | undefined) => {
        if (!color) return "";

        if (Ansi.color[color as Color]) {
            return Ansi.color[color as Color];
        }
        const rgbarr = toRgbColorCodeArray(color);
        if (rgbarr) {
            return rgbConverter(rgbarr);
        }

        return "";
    };
}

function toRgbColorCodeArray(s: string) {
    const hex6 = s.match(/#([A-Fa-f0-9]{2})([A-Fa-f0-9]{2})([A-Fa-f0-9]{2})/m);
    if (hex6) {
        return hex6rgb(hex6.slice(1, 4));
    }
    const hex3 = s.match(/#([A-Fa-f0-9]{1})([A-Fa-f0-9]{1})([A-Fa-f0-9]{1})/m);
    if (hex3) {
        return hex3rgb(hex3.slice(1, 4));
    }
    const rgbMatches = s.match(/rgb\((\d+)[,\s]+(\d+)[,\s]+(\d+)\)/m);
    if (rgbMatches) {
        return rgbMatches.slice(1, 4);
    }
}

function hex6rgb(hex: string[]) {
    const r: number[] = [];
    hex.forEach((h) => {
        r.push(...Buffer.from(h, "hex"));
    });
    return r;
}

function hex3rgb(hex: string[]) {
    const r: number[] = [];
    hex.forEach((h) => {
        r.push(...Buffer.from(h + h, "hex"));
    });
    return r;
}
