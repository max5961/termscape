import { DomElement } from "../dom/DomElement.js";
import chalk from "chalk/index.js";
import { parseRgb } from "../util/parseRgb.js";
import { BoxStyle } from "../dom/elements/attributes/box/BoxStyle.js";
import { Canvas } from "./Canvas.js";

export class Layout {
    private canvas: Canvas;
    private layers: Record<number, (() => void)[]>;

    /**
     * In order to correctly handle z-indexes, Boxes on top of other layers must
     * wipe their backgrounds.  In order to not arbitrarily wipe background, this
     * is used to make sure that only nodes with z-indexes > minLayer wipe bg
     */
    private minLayer: number;

    constructor() {
        this.canvas = new Canvas();
        this.layers = {};
        this.minLayer = 0;
    }

    public renderNode(elem: DomElement, canvas: Canvas, root = false) {
        if (root) canvas = this.canvas;

        const zIndex = (elem.props.style as BoxStyle).zIndex;
        const layer = typeof zIndex === "number" ? zIndex : 0;
        this.minLayer = Math.min(this.minLayer, layer);

        if (elem.tagname === "BOX_ELEMENT") {
            // this.deferOp(layer, () => this.renderBox(elem, canvas));
        }

        for (const child of elem.children) {
            let width = child.node.getComputedWidth();
            let height = child.node.getComputedHeight();

            const isOverflow = (elem.props.style as BoxStyle).overflow === "hidden";
            if (isOverflow || (elem.props.style as BoxStyle).overflowX === "hidden") {
                width = Math.min(elem.node.getComputedHeight(), width);
            }
            if (isOverflow || (elem.props.style as BoxStyle).overflowY === "hidden") {
                height = Math.min(elem.node.getComputedHeight(), height);
            }

            const offsetX = child.node.getComputedLeft() + this.canvas.corner.x;
            const offsetY = child.node.getComputedHeight() + this.canvas.corner.y;

            const childCanvas = new Canvas({
                grid: this.canvas.grid,
                dim: { width, height },
                corner: { x: offsetX, y: offsetY },
            });

            this.renderNode(child, childCanvas);
        }

        if (root) {
            const layers = Object.keys(this.layers)
                .sort((a, b) => Number(a) - Number(b))
                .map((s) => Number(s));

            for (const layer of layers) {
                this.layers[layer]?.forEach((operation) => operation());
            }
        }
    }

    public deferOp(layer: number, cb: () => unknown): void {
        this.layers[layer] = this.layers[layer] ?? [];
        this.layers[layer].push(cb);
    }
}

/*
 * layer.draw requires a Glyph to be created.  A Glyph is just an ansi styled (or
 * not styled at all) character, which ends up being inserted into a single grid
 * cell.  This makes sure that the ansi styles dont need to be parsed.
 * */
export class Glyph {
    private char!: string;

    constructor(glyph: GlyphConfig) {
        this.char = this.setGlyph(glyph);
    }

    public setGlyph(glyph: GlyphConfig): string {
        this.char = glyph.char;

        if (glyph.bold) {
            this.char = chalk.bold(this.char);
        }

        if (glyph.dimColor) {
            this.char = chalk.dim(this.char);
        }

        if (glyph.color) {
            const rgb = parseRgb(glyph.color);
            const hex = glyph.color.startsWith("#");

            if (rgb) {
                const gen = chalk.rgb(rgb[0], rgb[1], rgb[2])(this.char);
                if (gen) this.char = gen;
            } else if (hex) {
                const gen = chalk.hex(glyph.color)(this.char);
                if (gen) this.char = gen;
            } else {
                const gen = chalk[glyph.color]?.(this.char);
                if (gen) this.char = gen;
            }
        }

        return this.char;
    }

    public render(): string {
        return this.char;
    }
}
