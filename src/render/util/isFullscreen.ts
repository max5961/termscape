import { Canvas } from "../../canvas/Canvas.js";

export function isFullscreen(nextCanvas: Canvas) {
    return nextCanvas.grid.length >= process.stdout.columns;
}
