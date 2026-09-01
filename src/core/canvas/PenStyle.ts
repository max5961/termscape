import { Ansi } from "../Ansi.js";
import type { AnsiStyle, TextEffect } from "../../Types.js";
import type { ITextStyle } from "../style/IStyle.js";
import { objectKeys } from "../../util.js";

export class PenStyle {
    private prevAnsi: string | undefined;

    private _style: ITextStyle = {};
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

        const a: AnsiStyle[] = [];

        for (const key of objectKeys(this._style)) {
            if (key === "backgroundColor" && this._style.backgroundColor) {
                a.push(`bg-${this._style.backgroundColor}`);
            } else if (key === "color" && this._style.color) {
                a.push(this._style.color);
            } else if (key !== "dimColor" && this._style[key]) {
                a.push(key as TextEffect);
            }
        }

        return Ansi.styles(a) + this._style.dimColor ? Ansi.dimColor : "";
    }
}
