import { Ansi } from "../shared/Ansi.js";
import type { AnsiStyle } from "../Types.js";
import type { Style } from "../dom/style/Style.js";
import { TextEffectSet } from "../Constants.js";

export class Glyph {
    public style: Style.Text;

    constructor() {
        this.style = {};
    }

    public open() {
        const styles: AnsiStyle[] = [];

        for (const style of TextEffectSet) {
            if (this.style[style]) {
                styles.push(style);
            }
        }

        if (this.style.color) {
            styles.push(this.style.color);
        }

        if (this.style.backgroundColor) {
            styles.push(`bg-${this.style.backgroundColor}`);
        }

        const dimColor = this.style.dimColor ? Ansi.dimColor : "";

        return Ansi.styles(styles) + dimColor;
    }

    public close() {
        return Ansi.style.reset;
    }
}
