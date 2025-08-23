import type { BoxElement } from "../dom/BoxElement.js";
import type { TextElement } from "../dom/TextElement.js";
import type { Color, ShadowStyle, TextStyle } from "../Types.js";
import { Canvas } from "./Canvas.js";
import { alignRows, getRows } from "../shared/TextWrap.js";
import { TEXT_PADDING } from "../Symbols.js";
import { Borders, createBox } from "../shared/Borders.js";

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
            this.renderBorder(elem, style, canvas);
        }
    }

    private fillBg(canvas: Canvas, color?: Color) {
        const pen = canvas.getPen();
        pen.set("backgroundColor", color);

        for (let y = 0; y < canvas.realHeight; ++y) {
            pen.moveTo(0, y);
            pen.draw(" ", "r", canvas.realWidth);
        }
    }

    /** renders only round borders for now */
    private renderBorder(elem: BoxElement, style: ShadowStyle, canvas: Canvas) {
        const width = elem.node.getComputedWidth();
        const height = elem.node.getComputedHeight();

        const pen = canvas.getPen();

        const map = Array.isArray(elem.style.borderStyle)
            ? createBox(elem.style.borderStyle)
            : Borders[elem.style.borderStyle!];

        // prettier-ignore
        pen
            .set("color", style.borderTopColor)
            .set("dimColor", style.borderTopDimColor)
            .draw(map.topLeft, "r", 1)
            .draw(map.top, "r", width - 2)
            .draw(map.topRight, "d", 1);

        // prettier-ignore
        pen
            .set("color", style.borderRightColor)
            .set("dimColor", style.borderRightDimColor)
            .draw(map.right, "d", height - 2)

        // prettier-ignore
        pen
            .set("color", style.borderBottomColor)
            .set("dimColor", style.borderBottomDimColor)
            .draw(map.bottomRight, "l", 1)
            .draw(map.bottom, "l", width - 2)
            .draw(map.bottomLeft, "u", 1);

        // prettier-ignore
        pen
            .set("color", style.borderLeftColor)
            .set("dimColor", style.borderLeftDimColor)
            .draw(map.left, "u", height - 2)
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

        const rows = alignRows(
            getRows(elem.textContent, canvas.realWidth),
            canvas.realWidth,
            elem.style.align,
        );

        pen.setStyle(elem.style);

        for (let i = 0; i < rows.length; ++i) {
            pen.moveTo(0, i);
            for (let j = 0; j < rows[i].length; ++j) {
                let char = rows[i][j];

                if (char === TEXT_PADDING) {
                    char = " ";
                    pen.set("underline", false);
                } else {
                    pen.set("underline", elem.style.underline);
                }

                pen.draw(char as string, "r", 1);
            }
        }
    }
}
