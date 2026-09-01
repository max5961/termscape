import type { Canvas } from "../canvas/Canvas.js";
import type { CoreElement } from "../CoreElement.js";
import type { Draw } from "./Draw.js";

export abstract class DrawOperation {
    private readonly draw: Draw;

    constructor(drawOps: Draw) {
        this.draw = drawOps;
    }

    protected get lowestLayer() {
        return this.draw.getLowestLayer();
    }

    public abstract compose(core: CoreElement, canvas: Canvas): void;
}
