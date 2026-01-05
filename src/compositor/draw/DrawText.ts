import { DrawContract } from "./DrawContract.js";
import { HIDDEN_TRIMMED_WS, INPUT_ELEMENT, TEXT_PADDING } from "../../Constants.js";
import type { InputElement } from "../../dom/InputElement.js";
import type { TextElement } from "../../dom/TextElement.js";
import type { getAlignedRows } from "../../shared/TextWrap.js";
// import type { Canvas } from "../Canvas.js";
import type { Canvas } from "../Canvas.js";
import type { Pen } from "../Pen.js";
import type { Draw } from "./Draw.js";
import type { Style } from "../../dom/style/Style.js";

export class DrawText extends DrawContract<TextElement> {
    constructor(draw: Draw) {
        super(draw);
    }

    public override compose(elem: TextElement, canvas: Canvas): void {
        if (elem.parentElement?._is(INPUT_ELEMENT)) {
            return this.renderInputText(elem, canvas);
        }

        if (elem._singleLine) {
            return this.composeTextOverflow(elem, canvas);
        }

        return this.composeTextWrap(elem, canvas);
    }

    private composeTextOverflow(elem: TextElement, canvas: Canvas) {
        const pen = canvas.getPen();
        const slices = elem._getSlices();

        slices.forEach(([style, _idx, text]) => {
            pen.setStyle(style);
            for (let i = 0; i < text.length; ++i) {
                pen.draw(text[i] === "\t" ? " " : text[i], "r", 1);
            }
        });
    }

    private composeTextWrap(elem: TextElement, canvas: Canvas) {
        const textNodeSlices = elem._getSlices();
        const unalignedRows = elem._rows;
        const alignedRows = elem._alignedRows;
        const visRows = this.getTextRowSlice(elem, alignedRows);
        const rowStart = visRows.start;
        const rowEnd = visRows.end;
        const pen = canvas.getPen();

        let s = 0;
        let k = unalignedRows.slice(0, rowStart).reduce((a, c) => a + c.length, 0);

        for (let i = 0; i < textNodeSlices.length; ++i) {
            const [_, stop] = textNodeSlices[i];
            if (stop > k) {
                s = i;
                break;
            }
        }

        let [nextStyle, nextStop] = textNodeSlices[s] ?? [{}, Infinity];
        pen.setStyle(nextStyle);

        const iteratePen = () => {
            if (k <= nextStop) return;
            const slice = textNodeSlices[++s];
            if (slice) {
                [nextStyle, nextStop] = slice;
                pen.setStyle(nextStyle);
            }
        };

        for (let i = rowStart; i < rowEnd; ++i) {
            pen.moveTo(0, i);
            for (let j = 0; j < alignedRows[i].length; ++j) {
                let char = alignedRows[i][j];
                if (char !== TEXT_PADDING) ++k;
                iteratePen();
                if (char !== HIDDEN_TRIMMED_WS) {
                    char = this.resolveTextPadding(pen, nextStyle, char);
                    pen.draw(char, "r", 1);
                }
            }
        }
    }

    private resolveTextPadding(
        pen: Pen,
        style: Style.Text,
        char: string | symbol,
    ): string {
        if (char === TEXT_PADDING) {
            pen.set("underline", false);
            pen.set("backgroundColor", undefined);
            char = " ";
        } else {
            pen.set("underline", style.underline);
            pen.set("backgroundColor", style.backgroundColor);
        }

        return char as string;
    }

    private getTextRowSlice(elem: TextElement, rows: ReturnType<typeof getAlignedRows>) {
        const unclippedRect = elem.unclippedRect;
        const visRect = elem.visibleContentRect;
        const slice = { start: 0, end: 0 };
        if (!unclippedRect || !visRect) return slice;

        slice.start = Math.max(0, visRect.corner.y - unclippedRect.corner.y);
        slice.end = Math.max(0, slice.start + visRect.height);
        slice.end = Math.min(slice.end, rows.length);

        return slice;
    }

    private renderInputText(elem: TextElement, canvas: Canvas) {
        const pen = canvas.getPen();
        const inputEl = elem.parentElement! as InputElement;
        const cursorIdx = inputEl._cursorIdx;

        pen.set("color", inputEl._shadowStyle.color);
        for (let i = 0; i < elem.textContent.length; ++i) {
            if (inputEl.hasClaimedStdin && cursorIdx === i) {
                pen.set("backgroundColor", "gray"); // for now before cursorIdx style
            } else {
                pen.set("backgroundColor", undefined);
            }
            pen.draw(elem.textContent[i], "r", 1);
        }
    }
}
