import type { Color, DomElement } from "../Types.js";
import type { BaseShadowStyle } from "../style/Style.js";
import type { BoxLike } from "./types.js";
import { Canvas } from "./Canvas.js";
import { getAlignedRows, shouldTreatAsBreak } from "../shared/TextWrap.js";
import { TEXT_PADDING } from "../Symbols.js";
import { Borders, createBox } from "../shared/Borders.js";
import { BoxElement } from "../dom/BoxElement.js";
import { BookElement } from "../dom/BookElement.js";
import { ListElement } from "../dom/ListElement.js";
import { LayoutElement, LayoutNode } from "../dom/LayoutElement.js";
import { TextElement } from "../dom/TextElement.js";
import { CanvasElement } from "../dom/CanvasElement.js";
import type { Pen } from "./Pen.js";

export class Draw {
    /**
     * In order to correctly render z-indexes, Boxes on top of other layers must
     * wipe their backgrounds.  This ensures that nodes that don't need to wipe
     * backgrounds don't waste time doing so.
     */
    private _lowestLayer: number;
    public box: DrawBox;
    public text: DrawText;
    public canvasElement: DrawCanvasElement;

    constructor() {
        this._lowestLayer = 0;
        this.box = new DrawBox(this);
        this.text = new DrawText(this);
        this.canvasElement = new DrawCanvasElement(this);
    }

    public updateLowestLayer(zIndex: number): void {
        this._lowestLayer = Math.min(this._lowestLayer, zIndex);
    }

    public get lowestLayer() {
        return this._lowestLayer;
    }

    public compose(elem: DomElement, canvas: Canvas): void {
        if (this.isBoxLike(elem)) {
            this.box.compose(elem, canvas);
        } else if (elem instanceof TextElement) {
            this.text.compose(elem, canvas);
        } else if (elem instanceof CanvasElement) {
            this.canvasElement.compose(elem, canvas);
        }
    }

    private isBoxLike(elem: DomElement) {
        return (
            elem instanceof BoxElement ||
            elem instanceof BookElement ||
            elem instanceof ListElement ||
            elem instanceof LayoutElement ||
            elem instanceof LayoutNode
        );
    }
}

abstract class DrawContract<T extends BoxLike | TextElement | CanvasElement> {
    private draw: Draw;

    constructor(draw: Draw) {
        this.draw = draw;
    }

    protected get lowestLayer() {
        return this.draw.lowestLayer;
    }

    public abstract compose(elem: T, canvas: Canvas): void;
}

class DrawBox extends DrawContract<BoxLike> {
    constructor(draw: Draw) {
        super(draw);
    }

    public override compose(elem: BoxLike, canvas: Canvas): void {
        const style = elem.shadowStyle;

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

        for (let y = 0; y < canvas.canvasHeight; ++y) {
            pen.moveTo(0, y);
            pen.draw(" ", "r", canvas.canvasWidth);
        }
    }

    private renderBorder(elem: BoxLike, style: BaseShadowStyle, canvas: Canvas) {
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
}

class DrawText extends DrawContract<TextElement> {
    constructor(draw: Draw) {
        super(draw);
    }

    public override compose(elem: TextElement, canvas: Canvas): void {
        if (
            elem.shadowStyle.wrap === "overflow" ||
            elem.textContent.length <= canvas.canvasWidth
        ) {
            return this.composeTextOverflow(elem, canvas);
        }

        return this.composeTextWrap(elem, canvas);
    }

    private composeTextOverflow(elem: TextElement, canvas: Canvas) {
        const textContent = elem.textContent;
        const pen = canvas.getPen();
        pen.setStyle(elem.shadowStyle);

        for (let i = 0; i < textContent.length; ++i) {
            const char = textContent[i];
            if (shouldTreatAsBreak(char)) continue;
            // TODO - pen needs to handle chars w/ width > 1
            pen.draw(char === "\t" ? " " : char, "r", 1);
        }
    }

    private composeTextWrap(elem: TextElement, canvas: Canvas) {
        const pen = canvas.getPen();

        pen.setStyle(elem.shadowStyle);

        const rows = elem.alignedRows;
        const slice = this.getTextRowSlice(elem, rows);

        for (let i = slice.start; i < slice.end; ++i) {
            pen.moveTo(0, i);
            for (let j = 0; j < rows[i].length; ++j) {
                let char = rows[i][j];
                char = this.resolveTextPadding(pen, elem, char);
                pen.draw(char as string, "r", 1);
            }
        }
    }

    private resolveTextPadding(
        pen: Pen,
        elem: TextElement,
        char: string | symbol,
    ): string {
        if (char === TEXT_PADDING) {
            pen.set("underline", false);
            pen.set("backgroundColor", undefined);
            char = " ";
        } else {
            pen.set("underline", elem.style.underline);
            pen.set("backgroundColor", elem.style.backgroundColor);
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
}

class DrawCanvasElement extends DrawContract<CanvasElement> {
    constructor(draw: Draw) {
        super(draw);
    }

    public override compose(elem: CanvasElement, canvas: Canvas): void {
        const draw = elem.getProp("draw");
        if (draw) {
            const pen = canvas.getPen();
            draw(pen);
        }
    }
}
