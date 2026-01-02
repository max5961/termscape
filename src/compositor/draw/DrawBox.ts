import { DrawContract } from "./DrawContract.js";
import { Yg } from "../../Constants.js";
import {
    BackgroundCharacters,
    Borders,
    createBox,
    TitleBorders,
} from "../../shared/Boxes.js";
import type { Props, Scrollbar, Title, TitleStyleConfig } from "../../dom/props/Props.js";
import type { Shadow, Style } from "../../dom/style/Style.js";
import type { Canvas } from "../Canvas.js";
import type { Pen } from "../Pen.js";
import type { BoxLike } from "../types.js";
import type { Draw } from "./Draw.js";
import { logger } from "../../shared/Logger.js";

export class DrawBox extends DrawContract<BoxLike> {
    constructor(draw: Draw) {
        super(draw);
    }

    public override compose(elem: BoxLike, canvas: Canvas): void {
        const style = elem._shadowStyle;

        if (
            (style.zIndex ?? 0) > this.lowestLayer ||
            style.backgroundColor ||
            style.backgroundStyle
        ) {
            this.fillBg(canvas, elem);
        }

        if (style.borderStyle) {
            this.renderBorder(elem, style, canvas);
        }

        if (elem._getAnyProp("scrollbar")) {
            this.renderScrollbar(elem, canvas);
        }

        this.renderTitles(elem, canvas);
    }

    private fillBg(canvas: Canvas, elem: BoxLike) {
        const pen = canvas.getPen();
        const char = BackgroundCharacters[elem.style.backgroundStyle ?? "default"];

        pen.set("backgroundColor", elem._shadowStyle.backgroundColor);
        if (char !== " ") {
            pen.set("color", elem.style.backgroundStyleColor);
        }

        for (let y = 0; y < canvas.canvasHeight; ++y) {
            pen.moveTo(0, y);
            pen.draw(char, "r", canvas.canvasWidth);
        }
    }

    private renderBorder(elem: BoxLike, style: Shadow<Style.All>, canvas: Canvas) {
        const width = elem._node.getComputedWidth();
        const height = elem._node.getComputedHeight();

        const pen = canvas.getPen();
        const map = this.getBorders(elem);
        if (!map) {
            return logger.write("Warning: could not get border characters");
        }

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

    private getBorders(elem: BoxLike): ReturnType<typeof createBox> | undefined {
        if (elem.style.borderStyle) {
            return Array.isArray(elem.style.borderStyle)
                ? createBox(elem.style.borderStyle)
                : Borders[elem.style.borderStyle!];
        }
    }

    private renderScrollbar(elem: BoxLike, canvas: Canvas) {
        // type casting `Required`, but its possible that trackColor and barColor
        // are undefined.  This doesn't matter though, since setting the Pen
        // color to undefined isn't an issue if there isn't a color set.
        const scrollbar = elem._getAnyProp("scrollbar") as Required<Scrollbar>;

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
            unclippedContentUnits = elem._contentRange.low - elem._contentRange.high;
            pctScrolled = elem.getScrollData().y;
        } else {
            contentUnits = elem.unclippedContentRect.width;
            unclippedContentUnits = elem._contentRange.right - elem._contentRange.left;
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

    private static TitleProps: (keyof Props.BoxLike)[] = [
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
            const title = elem._getAnyProp(prop) as Title | undefined;
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
            const borderLeft = elem._node.getComputedBorder(Yg.EDGE_LEFT);
            const borderRight = elem._node.getComputedBorder(Yg.EDGE_RIGHT);
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

        let left = "";
        let right = "";
        const borders = this.getBorders(elem);
        if (borders) {
            const hashedConfig = TitleBorders[title.style][
                borders.top as keyof (typeof TitleBorders)["capped"]
            ] ?? { left: "", right: "" };
            left = hashedConfig.left ?? "";
            right = hashedConfig.right ?? "";
        }

        return {
            left,
            right,
            leftColor: elem._shadowStyle.borderLeftColor ?? elem._shadowStyle.borderColor,
            rightColor:
                elem._shadowStyle.borderRightColor ?? elem._shadowStyle.borderColor,
        };
    }
}
