import type { CanvasElement } from "../../dom/CanvasElement.js";
// import type { Canvas } from "../Canvas.js";
import type { Canvas } from "../Canvas.js";
import type { Draw } from "./Draw.js";
import { DrawContract } from "./DrawContract.js";

export class DrawCanvasElement extends DrawContract<CanvasElement> {
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
