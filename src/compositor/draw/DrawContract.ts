import type { CanvasElement } from "../../dom/CanvasElement.js";
import type { TextElement } from "../../dom/TextElement.js";
// import type { Canvas } from "../Canvas.js";
import type { Canvas } from "../Canvas.js";
import type { BoxLike } from "../types.js";
import type { Draw } from "./Draw.js";

export abstract class DrawContract<T extends BoxLike | TextElement | CanvasElement> {
    private draw: Draw;

    constructor(draw: Draw) {
        this.draw = draw;
    }

    protected get lowestLayer() {
        return this.draw.lowestLayer;
    }

    public abstract compose(elem: T, canvas: Canvas): void;
}
