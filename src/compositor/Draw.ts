import Yoga from "yoga-wasm-web/auto";
import type { Color, DomElement } from "../Types.js";
import type { BaseShadowStyle } from "../style/Style.js";
import type { BoxLike } from "./types.js";
import type { Canvas } from "./Canvas.js";
import { getAlignedRows, shouldTreatAsBreak } from "../shared/TextWrap.js";
import { TEXT_PADDING } from "../Symbols.js";
import { Borders, createBox, TitleBorders } from "../shared/Borders.js";
import { BoxElement } from "../dom/BoxElement.js";
import { BookElement } from "../dom/BookElement.js";
import { ListElement } from "../dom/ListElement.js";
import { LayoutElement, LayoutNode } from "../dom/LayoutElement.js";
import { TextElement } from "../dom/TextElement.js";
import { CanvasElement } from "../dom/CanvasElement.js";
import type { Pen } from "./Pen.js";
import type { BaseProps, Scrollbar, Title, TitleStyleConfig } from "../Props.js";

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

        if (elem.getBaseProp("scrollbar")) {
            this.renderScrollbar(elem, canvas);
        }

        this.renderTitles(elem, canvas);
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
        const map = this.getBorders(elem);

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

    private getBorders(elem: BoxLike): ReturnType<typeof createBox> {
        return Array.isArray(elem.style.borderStyle)
            ? createBox(elem.style.borderStyle)
            : Borders[elem.style.borderStyle!];
    }

    private renderScrollbar(elem: BoxLike, canvas: Canvas) {
        // type casting `Required`, but its possible that trackColor and barColor
        // are undefined.  This doesn't matter though, since setting the Pen
        // color to undefined isn't an issue if there isn't a color set.
        const scrollbar = elem.getBaseProp("scrollbar") as Required<Scrollbar>;

        const units = this.getScrollBarUnits(elem, scrollbar.edge);
        const direction =
            scrollbar.edge === "right" || scrollbar.edge === "left" ? "d" : "r";

        const pen = canvas.getPen();
        this.getScrollbarPenStart(pen, scrollbar.edge, scrollbar.placement);

        const setTrackPen = () => {
            pen.set("color", scrollbar.trackColor);
            pen.set(
                "imageNegative",
                scrollbar.trackChar === " " && !!scrollbar.trackColor,
            );
        };

        const setBarPen = () => {
            pen.set("color", scrollbar.barColor);
            pen.set("imageNegative", scrollbar.barChar === " ");
        };

        const drawTrack = (units: number) => {
            if (
                // in padding zone - safe to draw
                scrollbar.placement === "padding-inner" ||
                scrollbar.placement === "padding-outer" ||
                // trackChar or trackColor is intentional - overwriting the border is okay
                scrollbar.trackChar !== " " ||
                scrollbar.trackColor
            ) {
                pen.draw(scrollbar.trackChar, direction, units);
            } else {
                pen.move(direction, units);
            }
        };

        // track start
        setTrackPen();
        drawTrack(units.startUnits);
        // bar
        setBarPen();
        pen.draw(scrollbar.barChar, direction, units.barUnits);
        // track end
        setTrackPen();
        drawTrack(units.endUnits);
    }

    private getScrollBarUnits(elem: BoxLike, side: Scrollbar["edge"]) {
        let contentUnits: number;
        let unclippedContentUnits: number;
        let pctScrolled: number;
        if (side === "left" || side === "right") {
            contentUnits = elem.unclippedContentRect.height;
            unclippedContentUnits = elem.contentRange.low - elem.contentRange.high;
            pctScrolled = elem.getScrollData().y;
        } else {
            contentUnits = elem.unclippedContentRect.width;
            unclippedContentUnits = elem.contentRange.right - elem.contentRange.left;
            pctScrolled = elem.getScrollData().x;
        }

        const barPct = Math.min(1, contentUnits / unclippedContentUnits);
        const barUnits = Math.max(1, Math.ceil(barPct * contentUnits));

        const trackUnits = elem.unclippedContentRect.height - barUnits;
        const trackStartUnits = Math.ceil((trackUnits * pctScrolled) / 100);
        const trackEndUnits = Math.max(0, trackUnits - trackStartUnits);

        return {
            startUnits: trackStartUnits,
            barUnits: barUnits,
            endUnits: trackEndUnits,
        };
    }

    private getScrollbarPenStart(
        pen: Pen,
        edge: Exclude<Scrollbar["edge"], undefined>,
        placement: Scrollbar["placement"],
    ) {
        // RIGHT
        if (edge === "left" || edge === "right") {
            pen.moveYToEdge("top", "content", "inner");
            pen.moveXToEdge(
                edge,
                placement === "border" ? "border" : "padding",
                placement === "border" || placement === "padding-inner"
                    ? "inner"
                    : "outer",
            );
        } else {
            pen.moveXToEdge("left", "content", "inner");
            pen.moveYToEdge(
                edge,
                placement === "border" ? "border" : "content",
                placement === "border" || placement === "padding-inner"
                    ? "inner"
                    : "outer",
            );
        }
    }

    private static TitleProps: (keyof BaseProps)[] = [
        "titleTopRight",
        "titleBottomRight",
        "titleTopCenter",
        "titleBottomCenter",
        "titleTopLeft",
        "titleBottomLeft",
    ];

    private renderTitles(elem: BoxLike, canvas: Canvas): void {
        const pen = canvas.getPen();

        DrawBox.TitleProps.forEach((prop) => {
            const title = elem.getBaseProp(prop) as Title | undefined;
            if (!title) return;

            if (prop.includes("Top")) {
                pen.moveYToEdge("top", "border", "inner");
            } else {
                pen.moveYToEdge("bottom", "border", "inner");
            }

            const config = this.getTitleStyleConfig(elem, title);
            const textWidth =
                config.left.length + config.right.length + title.textContent.length;
            const rect = elem.unclippedRect;
            const borderLeft = elem.node.getComputedBorder(Yoga.EDGE_LEFT);
            const borderRight = elem.node.getComputedBorder(Yoga.EDGE_RIGHT);
            const contentWidth = rect.width - borderLeft - borderRight;

            const canDraw = () => {
                return (
                    pen.getGlobalPos().x < rect.corner.x + rect.width - borderRight &&
                    pen.getGlobalPos().x >= rect.corner.x + borderLeft
                );
            };

            if (prop.includes("Left")) {
                pen.moveXToEdge("left", "padding", "outer");
            } else if (prop.includes("Center")) {
                pen.moveXToEdge("left", "padding", "outer");
                // prettier-ignore
                pen.move("r", Math.floor(contentWidth / 2 - textWidth / 2));
            } else {
                pen.moveXToEdge("right", "padding", "outer");
                pen.move("l", textWidth);
            }

            // LEFT CHAR
            pen.set("color", config.leftColor);
            for (let i = 0; i < config.left.length; ++i) {
                if (canDraw()) {
                    pen.draw(config.left[i], "r", 1);
                } else {
                    pen.move("r", 1);
                }
            }

            // TEXT CONTENT
            pen.set("color", title.color);
            for (let i = 0; i < title.textContent.length; ++i) {
                if (canDraw()) {
                    pen.draw(title.textContent[i], "r", 1);
                } else {
                    pen.move("r", 1);
                }
            }

            // RIGHT CHAR
            pen.set("color", config.rightColor);
            for (let i = 0; i < config.right.length; ++i) {
                if (canDraw()) {
                    pen.draw(config.right[i], "r", 1);
                } else {
                    pen.move("r", 1);
                }
            }
        });
    }

    private getTitleStyleConfig(elem: BoxLike, title: Title): TitleStyleConfig {
        if (typeof title.style === "object") {
            return {
                ...title.style,
                right: title.style.right ?? "",
                left: title.style.left ?? "",
            };
        }
        if (title.style === undefined) {
            return { left: "", right: "" };
        }

        const borders = this.getBorders(elem);
        const hashedConfig = TitleBorders[title.style][
            borders.top as keyof (typeof TitleBorders)["capped"]
        ] ?? { left: "", right: "" };

        return {
            left: hashedConfig.left ?? "",
            right: hashedConfig.right ?? "",

            // TODO - these need to be able to handle borderTop/borderBottom specific colors
            leftColor: elem.shadowStyle.borderColor,
            rightColor: elem.shadowStyle.borderColor,
        };
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
