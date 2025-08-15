import { DomElement } from "../dom/DomElement.js";
import { type Color } from "../types.js";
import { Canvas } from "../canvas/Canvas.js";
import type { ShadowStyle } from "../style/Style.js";

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

    public composeBox(elem: DomElement, style: ShadowStyle, canvas: Canvas) {
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

        // Truncate dimensions to not exceed oveflow
        const height = Math.min(canvas.nodeHeight, canvas.cvHeight);
        const width = Math.min(canvas.nodeWidth, canvas.cvWidth);

        for (let y = 0; y < height; ++y) {
            pen.moveTo(0, y);
            pen.draw(" ", "r", width);
        }
    }

    /** renders only round borders for now */
    private renderBorder(elem: DomElement, canvas: Canvas) {
        const width = elem.node.getComputedWidth();
        const height = elem.node.getComputedHeight();

        const pen = canvas.getPen();

        pen.draw("╭", "r", 1)
            .draw("─", "r", width - 2)
            .draw("╮", "d", 1)
            .draw("│", "d", height - 2)
            .draw("╯", "l", 1)
            .draw("─", "l", width - 2)
            .draw("╰", "u", 1)
            .draw("│", "u", height - 2);
    }
}
