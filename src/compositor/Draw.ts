import { DomElement } from "../dom/DomElement.js";
import { type Color } from "../types.js";
import { Canvas } from "../canvas/Canvas.js";
import type { ShadowStyle, TextStyle } from "../style/Style.js";
// import { type TextElement } from "../dom/elements/TextElement.js";

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

    // =========================================================================
    // Box
    // =========================================================================

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

        for (let y = 0; y < canvas.nodeHeight; ++y) {
            pen.moveTo(0, y);
            pen.draw(" ", "r", canvas.nodeWidth);
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

    // =========================================================================
    // Text
    // =========================================================================

    public composeText(elem: DomElement, style: TextStyle, canvas: Canvas) {
        if (style.wrap === "overflow") {
            return this.composeTextOverflow(elem, canvas);
        }
        return this.composeTextWrap(elem, canvas);
    }

    private composeTextOverflow(elem: DomElement, canvas: Canvas) {
        const textContent = (elem as any).textContent;
        const pen = canvas.getPen();

        for (let i = 0; i < textContent.length; ++i) {
            pen.draw(textContent[i], "r", 1);
        }
    }

    private composeTextWrap(_elem: DomElement, _canvas: Canvas) {
        // const pen = canvas.getPen();
        // const words = getWords(elem.textContent);
    }
}
