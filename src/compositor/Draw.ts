import type { BoxElement } from "../dom/BoxElement.js";
import type { TextElement } from "../dom/TextElement.js";
import { DomElement } from "../dom/DomElement.js";
import type { Color, ShadowStyle, TextStyle } from "../Types.js";
import { Canvas } from "./Canvas.js";
import { alignRows, getRows } from "../shared/TextWrap.js";

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

    public composeBox(elem: BoxElement, style: ShadowStyle, canvas: Canvas) {
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
    private renderBorder(elem: BoxElement, canvas: Canvas) {
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

    public composeText(elem: TextElement, style: TextStyle, canvas: Canvas) {
        if (style.wrap === "overflow") {
            return this.composeTextOverflow(elem, canvas);
        }
        return this.composeTextWrap(elem, canvas);
    }

    private composeTextOverflow(elem: TextElement, canvas: Canvas) {
        const textContent = elem.textContent;
        const pen = canvas.getPen();

        for (let i = 0; i < textContent.length; ++i) {
            pen.draw(textContent[i], "r", 1);
        }
    }

    private composeTextWrap(elem: TextElement, canvas: Canvas) {
        const pen = canvas.getPen();
        let rows = getRows(elem.textContent, canvas.nodeWidth);
        rows = alignRows(rows, canvas.nodeWidth, elem.style.align);

        pen.set.color(elem.style.color);

        for (let i = 0; i < rows.length; ++i) {
            pen.moveTo(0, i);
            for (let j = 0; j < rows[i].length; ++j) {
                pen.draw(rows[i][j], "r", 1);
            }
        }
    }
}
