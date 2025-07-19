import { DomElement } from "../dom/DomElement.js";
import chalk from "chalk/index.js";
import { parseRgb } from "../util/parseRgb.js";
import { BoxStyle } from "../dom/elements/attributes/box/BoxStyle.js";
import { Canvas } from "./Canvas.js";

/**
 * Used in mouse event handling
 */
export type PositionLayer = {
    x: Record<number, DomElement[]>;
    y: Record<number, DomElement[]>;
};

export class Layout {
    private canvas: Canvas;
    private layers: Record<number, (() => void)[]>;

    /**
     * In order to correctly handle z-indexes, Boxes on top of other layers must
     * wipe their backgrounds.  This ensures that nodes that don't need to wipe
     * backgrounds don't waste time doing so.
     */
    private minLayer: number;

    private positionLayers: Record<number, PositionLayer>;

    constructor() {
        this.canvas = new Canvas();
        this.layers = {};
        this.minLayer = 0;
        this.positionLayers = {};
    }

    public renderNode(elem: DomElement, canvas: Canvas, root = false) {
        if (root) canvas = this.canvas;

        if ((elem.props.style as BoxStyle).display === "none") return;

        const zIndex = (elem.props.style as BoxStyle).zIndex;
        const layer = typeof zIndex === "number" ? zIndex : 0;
        this.minLayer = Math.min(this.minLayer, layer);

        this.pushToPositionLayer({
            layer: layer,
            elem: elem,
            x: canvas.corner.x,
            y: canvas.corner.y,
        });

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
            const offsetY = child.node.getComputedTop() + this.canvas.corner.y;

            const childCanvas = new Canvas({
                grid: this.canvas.grid,
                dim: { width, height },
                corner: { x: offsetX, y: offsetY },
            });

            this.renderNode(child, childCanvas);
        }

        if (root) {
            const callInOrder = (obj: Record<number, (() => unknown)[]>) => {
                const layers = Object.keys(this.layers)
                    .sort((a, b) => Number(a) - Number(b))
                    .map((s) => Number(s));

                for (const layer of layers) {
                    this.layers[layer]?.forEach((operation) => operation());
                }
            };

            callInOrder(this.layers);
        }
    }

    public deferOp(layer: number, cb: () => unknown): void {
        this.layers[layer] = this.layers[layer] ?? [];
        this.layers[layer].push(cb);
    }

    public pushToPositionLayer({
        layer,
        x,
        y,
        elem,
    }: {
        layer: number;
        x: number;
        y: number;
        elem: DomElement;
    }) {
        this.positionLayers[layer] = this.positionLayers[layer] ?? {
            x: {},
            y: {},
        };

        this.positionLayers[layer].x[x] = this.positionLayers[layer].x[x] ?? [];
        this.positionLayers[layer].y[y] = this.positionLayers[layer].y[y] ?? [];

        this.positionLayers[layer].x[x].push(elem);
        this.positionLayers[layer].y[y].push(elem);
    }

    public findTargetElement(x: number, y: number): DomElement | undefined {
        // Sort descending
        const sortedLayers = Object.keys(this.positionLayers)
            .sort((a, b) => Number(b) - Number(a))
            .map((s) => Number(s));

        for (const layerIdx of sortedLayers) {
            // Decide if we should traverse the X or Y axis. It makes more sense
            // to traverse whichever contains the most unique points.  For example,
            // imagine an up-down list/stack of elements.  We'd need to check every
            // element if we checked the X axis, but if we check the Y axis, the
            // first element we bump into will be a match.

            const layer = this.positionLayers[layerIdx];
            const traverseX = Object.keys(layer.x).length > Object.keys(layer.y).length;
            const map = traverseX ? layer.x : layer.y;
            let i = traverseX ? x : y;

            while (i >= 0) {
                if (map[i]) {
                    for (const elem of map[i]) {
                        // if (elem.contains(x, y)) return elem
                    }
                }
                --i;
            }
        }

        return undefined;
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
