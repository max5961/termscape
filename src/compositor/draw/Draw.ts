import {
    BOOK_ELEMENT,
    BOX_ELEMENT,
    CANVAS_ELEMENT,
    LAYOUT_ELEMENT,
    LAYOUT_NODE,
    LIST_ELEMENT,
    TEXT_ELEMENT,
    INPUT_ELEMENT,
} from "../../Constants.js";
import type { DomElement } from "../../dom/DomElement.js";
// import type { Canvas } from "../Canvas.js";
import type { Canvas } from "../Canvas.js";
import { DrawBox } from "./DrawBox.js";
import { DrawText } from "./DrawText.js";
import { DrawCanvasElement } from "./DrawCanvas.js";

export class Draw {
    /**
     * In order to correctly render z-indexes, Boxes on top of other layers must
     * wipe their backgrounds.  This ensures that nodes that don't need to wipe
     * backgrounds don't waste time doing so.
     */
    private _lowestLayer: number;
    private box: DrawBox;
    private text: DrawText;
    private canvasElement: DrawCanvasElement;

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
        } else if (elem._is(TEXT_ELEMENT)) {
            this.text.compose(elem, canvas);
        } else if (elem._is(CANVAS_ELEMENT)) {
            this.canvasElement.compose(elem, canvas);
        }
    }

    private isBoxLike(elem: DomElement) {
        return (
            elem._is(BOX_ELEMENT) ||
            elem._is(BOOK_ELEMENT) ||
            elem._is(LIST_ELEMENT) ||
            elem._is(LAYOUT_ELEMENT) ||
            elem._is(LAYOUT_NODE) ||
            elem._is(INPUT_ELEMENT)
        );
    }
}
