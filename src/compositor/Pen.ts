import Yoga from "yoga-wasm-web/auto";
import type { DomElement, Point } from "../Types.js";
import type { TextStyle } from "../style/Style.js";
import type { Canvas, Grid } from "./Canvas.js";
import { Glyph } from "./Glyph.js";

type Direction = "u" | "d" | "l" | "r";

type PenDeps = {
    grid: Grid;
    canvas: Canvas;
};

const styleSet = new Set<keyof TextStyle>([
    "color",
    "backgroundColor",
    "italic",
    "bold",
    "dimColor",
    "underline",
    "imagePositive",
    "imageNegative",
    "fontDefault",
    "font1",
    "font2",
    "font3",
    "font4",
    "font5",
    "font6",
]);

export class Pen {
    private readonly grid: Grid;
    private readonly pos: Point;
    private readonly corner: Point;
    private readonly limits: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    };
    private readonly glyph: Glyph;
    private readonly elem: DomElement;

    constructor(deps: PenDeps) {
        this.grid = deps.grid;
        this.pos = { ...deps.canvas.corner };
        this.corner = { ...deps.canvas.corner };
        this.elem = deps.canvas.el;

        this.limits = {
            minX: deps.canvas.limits.minX,
            minY: deps.canvas.limits.minY,
            maxX: deps.canvas.limits.maxX,
            maxY: deps.canvas.limits.maxY,
        };

        this.glyph = new Glyph();
    }

    public set<T extends keyof TextStyle>(prop: T, value?: TextStyle[T]) {
        this.glyph.style[prop] = value;
        return this;
    }

    public setStyle(config: TextStyle) {
        for (const style of styleSet) {
            // @ts-expect-error typescript can't infer that an two objs with the same shape using the same key have the same value types
            this.glyph.style[style] = config[style];
        }
    }

    /**
     * Moves to a position **relative** to the corner of the canvas.
     * */
    public moveTo = (x: number, y: number): Pen => {
        this.pos.x = this.corner.x + x;
        this.pos.y = this.corner.y + y;
        return this;
    };

    /**
     * @internal
     *
     * Moves to a position relative to the **root** canvas.
     * */
    public moveToGlobal = (x: number, y: number): Pen => {
        this.pos.x = x;
        this.pos.y = y;
        return this;
    };

    public moveXToEdge = (
        edge: "left" | "right",
        /**
         * Same as CSS box model
         * */
        box: "border" | "padding" | "content",
        /**
         * For example, if padding is 5:
         * - 'inside' positions at the inner edge of the selected box
         * - 'outside' positions at the outer edge of the selected box
         * */
        side: "inner" | "outer",
    ): Pen => {
        const border = {
            left: this.elem.node.getComputedBorder(Yoga.EDGE_LEFT),
            right: this.elem.node.getComputedBorder(Yoga.EDGE_RIGHT),
        };

        const padding = {
            left: this.elem.node.getComputedPadding(Yoga.EDGE_LEFT),
            right: this.elem.node.getComputedPadding(Yoga.EDGE_RIGHT),
        };

        const rect = this.elem.unclippedRect;
        const content = this.elem.unclippedContentRect;

        let x = 0;

        // LEFT
        if (edge === "left") {
            if (box === "border") {
                if (side === "outer") {
                    x = rect.corner.x;
                } else {
                    x += rect.corner.x + Math.max(1, border.left) - 1;
                }
            } else if (box === "padding") {
                if (side === "outer") {
                    x = rect.corner.x + border.left;
                } else {
                    x = rect.corner.x + border.left + Math.max(1, padding.left) - 1;
                }
            } else if (box === "content") {
                x = content.corner.x;
            }
        }

        // RIGHT
        else if (edge === "right") {
            if (box === "border") {
                if (side === "outer") {
                    x = rect.corner.x + rect.width - 1;
                } else {
                    x = rect.corner.x + rect.width - 1 - Math.max(1, border.right) + 1;
                }
            } else if (box === "padding") {
                if (side === "outer") {
                    x = rect.corner.x + rect.width - border.right - 1;
                } else {
                    // prettier-ignore
                    x = rect.corner.x + rect.width - border.right - Math.max(1, padding.right);
                }
            } else if (box === "content") {
                x = content.corner.x + content.width;
            }
        }

        this.pos.x = x;
        return this;
    };

    public moveYToEdge = (
        edge: "top" | "bottom",
        /**
         * Same as CSS box model
         * */
        box: "border" | "padding" | "content",
        /**
         * For example, if padding is 5:
         * - 'inside' positions at the inner edge of the selected box
         * - 'outside' positions at the outer edge of the selected box
         * */
        side: "inner" | "outer",
    ): Pen => {
        const border = {
            top: this.elem.node.getComputedBorder(Yoga.EDGE_TOP),
            bottom: this.elem.node.getComputedBorder(Yoga.EDGE_BOTTOM),
        };

        const padding = {
            top: this.elem.node.getComputedPadding(Yoga.EDGE_TOP),
            bottom: this.elem.node.getComputedPadding(Yoga.EDGE_BOTTOM),
        };

        const rect = this.elem.unclippedRect;
        const content = this.elem.unclippedContentRect;

        let y = 0;

        // TOP
        if (edge === "top") {
            if (box === "border") {
                if (side === "outer") {
                    y = rect.corner.y;
                } else {
                    y = rect.corner.y + Math.max(1, border.top) - 1;
                }
            } else if (box === "padding") {
                if (side === "outer") {
                    y = rect.corner.y + border.top;
                } else {
                    y = rect.corner.y + border.top + Math.max(1, padding.top) - 1;
                }
            } else if (box === "content") {
                y = content.corner.y;
            }
        }

        // BOTTOM
        else if (edge === "bottom") {
            if (box === "border") {
                if (side === "outer") {
                    y = rect.corner.x + rect.height - 1;
                } else {
                    y = rect.corner.x + rect.height - 1 - Math.max(1, border.bottom) + 1;
                }
            } else if (box === "padding") {
                if (side === "outer") {
                    y = rect.corner.y + rect.height - border.bottom;
                } else {
                    // prettier-ignore
                    y = rect.corner.y + rect.height - border.bottom - Math.max(1, padding.bottom) + 1;
                }
            } else if (box === "content") {
                y = content.corner.y + content.height;
            }
        }

        this.pos.y = y;
        return this;
    };

    public move = (dir: Direction, units: number): Pen => {
        if (dir === "u") this.pos.y -= units;
        if (dir === "d") this.pos.y += units;
        if (dir === "l") this.pos.x -= units;
        if (dir === "r") this.pos.x += units;
        return this;
    };

    public draw = (char: string, dir: Direction, units: number): Pen => {
        if (char === "") return this;

        const ansi = this.glyph.open();

        let dx = 0;
        let dy = 0;

        if (dir === "u") dy = -1;
        if (dir === "d") dy = 1;
        if (dir === "l") dx = -1;
        if (dir === "r") dx = 1;

        let { x, y } = this.pos;

        for (let i = 0; i < units; ++i) {
            if (this.isValidCell(x, y)) {
                if (ansi) {
                    this.grid[y][x] = { ansi, char, charWidth: 1 };
                } else {
                    this.grid[y][x] = char;
                }
            }

            x += dx;
            y += dy;
        }

        this.pos.x = x;
        this.pos.y = y;

        return this;
    };

    private isValidCell(x: number, y: number) {
        if (this.grid[y] === undefined || this.grid[y][x] === undefined) {
            return false;
        }

        if (x < this.limits.minX) {
            return false;
        }
        if (y < this.limits.minY) {
            return false;
        }
        if (x >= this.limits.maxX) {
            return false;
        }
        if (y >= this.limits.maxY) {
            return false;
        }
        return true;
    }
}
