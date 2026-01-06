import { TextStyleSet, Yg } from "../Constants.js";
import { Glyph } from "./Glyph.js";
import { ErrorMessages } from "../shared/ErrorMessages.js";
import type { DomElement } from "../dom/DomElement.js";
import type { Point } from "../Types.js";
import type { Style } from "../dom/style/Style.js";
import type { Canvas, Grid } from "./Canvas.js";

type Direction = "u" | "d" | "l" | "r";

type PenDeps = {
    grid: Grid;
    canvas: Canvas;
};

export class Pen {
    private readonly _grid: Grid;
    private readonly _pos: Point;
    private readonly _corner: Point;
    private readonly _limits: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    };
    private readonly glyph: Glyph;
    private readonly elem: DomElement;

    constructor(deps: PenDeps) {
        this._grid = deps.grid;
        this._pos = { ...deps.canvas.corner };
        this._corner = { ...deps.canvas.corner };
        this.elem = deps.canvas.host;

        this._limits = {
            minX: deps.canvas.limits.minX,
            minY: deps.canvas.limits.minY,
            maxX: deps.canvas.limits.maxX,
            maxY: deps.canvas.limits.maxY,
        };

        this.glyph = new Glyph();
    }

    public set<T extends keyof Style.Text>(prop: T, value?: Style.Text[T]) {
        this.glyph.style[prop] = value;
        return this;
    }

    public setStyle(config: Style.Text) {
        for (const style of TextStyleSet) {
            // @ts-expect-error typescript can't infer that an two objs with the same shape using the same key have the same value types
            this.glyph.style[style] = config[style];
        }
    }

    public getGlobalPos(): Point {
        return { ...this._pos };
    }

    /**
     * Moves to a position **relative** to the current position.
     * */
    public move = (dir: Direction, units: number): Pen => {
        if (dir === "u") this._pos.y -= units;
        if (dir === "d") this._pos.y += units;
        if (dir === "l") this._pos.x -= units;
        if (dir === "r") this._pos.x += units;
        return this;
    };

    /**
     * Moves to a position **relative** to the corner of the canvas.
     * */
    public moveTo = (x: number, y: number): Pen => {
        this._pos.x = this._corner.x + x;
        this._pos.y = this._corner.y + y;
        return this;
    };

    /**
     * @internal
     *
     * Moves to a position relative to the **root** canvas.
     * */
    public moveToGlobal = (x: number, y: number): Pen => {
        this._pos.x = x;
        this._pos.y = y;
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
            left: this.elem._node.getComputedBorder(Yg.EDGE_LEFT),
            right: this.elem._node.getComputedBorder(Yg.EDGE_RIGHT),
        };

        const padding = {
            left: this.elem._node.getComputedPadding(Yg.EDGE_LEFT),
            right: this.elem._node.getComputedPadding(Yg.EDGE_RIGHT),
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

        this._pos.x = x;
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
            top: this.elem._node.getComputedBorder(Yg.EDGE_TOP),
            bottom: this.elem._node.getComputedBorder(Yg.EDGE_BOTTOM),
        };

        const padding = {
            top: this.elem._node.getComputedPadding(Yg.EDGE_TOP),
            bottom: this.elem._node.getComputedPadding(Yg.EDGE_BOTTOM),
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
                    y = rect.corner.y + rect.height - 1;
                } else {
                    y = rect.corner.y + rect.height - 1 - Math.max(1, border.bottom) + 1;
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

        this._pos.y = y;
        return this;
    };

    public draw = (char: string, dir: Direction, units: number): Pen => {
        if (char === "") return this;
        if (char === undefined) {
            this.elem._throwError(ErrorMessages.drawUndefinedError);
        }

        const ansi = this.glyph.open();

        let dx = 0;
        let dy = 0;

        if (dir === "u") dy = -1;
        else if (dir === "d") dy = 1;
        else if (dir === "l") dx = -1;
        else if (dir === "r") dx = 1;

        let { x, y } = this._pos;

        for (let i = 0; i < units; ++i) {
            if (this.isValidCell(x, y)) {
                if (ansi) {
                    this._grid[y][x] = { ansi, char, charWidth: 1 };
                } else {
                    this._grid[y][x] = char;
                }
            }

            x += dx;
            y += dy;
        }

        this._pos.x = x;
        this._pos.y = y;

        return this;
    };

    private isValidCell(x: number, y: number) {
        if (this._grid[y] === undefined || this._grid[y][x] === undefined) {
            return false;
        }

        if (x < this._limits.minX) {
            return false;
        }
        if (y < this._limits.minY) {
            return false;
        }
        if (x >= this._limits.maxX) {
            return false;
        }
        if (y >= this._limits.maxY) {
            return false;
        }
        return true;
    }
}
