import { DomElement } from "../dom/DomElement.js";
import { type Color } from "../types.js";
import { Canvas } from "../canvas/Canvas.js";
import type { RStyle } from "../style/Style.js";

export class Draw {
    /**
     * In order to correctly render z-indexes, Boxes on top of other layers must
     * wipe their backgrounds.  This ensures that nodes that don't need to wipe
     * backgrounds don't waste time doing so.
     */
    private lowestLayer: number;

    constructor() {
        this.lowestLayer = 0;
    }

    public updateLowestLayer(zIndex: number): void {
        this.lowestLayer = Math.min(this.lowestLayer, zIndex);
    }

    public composeBox(elem: DomElement, style: RStyle, canvas: Canvas) {
        if ((style.zIndex ?? 0) > this.lowestLayer || style.backgroundColor) {
            this.fillBg(canvas, style.backgroundColor);
        }

        if (style.borderStyle) {
            this.renderBorder(elem, canvas);
        }
    }

    private fillBg(canvas: Canvas, color?: Color) {
        const pen = canvas.getPen();
        if (color) {
            pen.set.bgColor(`bg-${color}`);
        }

        for (let y = canvas.corner.y; y < canvas.height; ++y) {
            pen.moveTo(canvas.corner.x, y);
            pen.draw(" ", "R", canvas.width);
        }
    }

    /** renders only round borders for now */
    private renderBorder(elem: DomElement, canvas: Canvas) {
        const width = elem.node.getComputedWidth();
        const height = elem.node.getComputedHeight();

        const pen = canvas.getPen({ linked: false });

        pen.draw("╭", "R", 1)
            .draw("─", "R", width - 2)
            .draw("╮", "D", 1)
            .draw("│", "D", height - 2)
            .draw("╯", "L", 1)
            .draw("─", "L", width - 2)
            .draw("╰", "U", 1)
            .draw("│", "U", height - 2);
    }
}
