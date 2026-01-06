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
import type { Canvas } from "../Canvas.js";
import { DrawBox } from "./DrawBox.js";
import { DrawText } from "./DrawText.js";
import { DrawCanvasElement } from "./DrawCanvas.js";

export class Draw {
    private _lowestLayer: number;
    private _layers: Record<number, (() => unknown)[]>;
    private _box: DrawBox;
    private _text: DrawText;
    private _canvasElement: DrawCanvasElement;

    constructor() {
        this._lowestLayer = 0;
        this._layers = {};
        this._box = new DrawBox(this);
        this._text = new DrawText(this);
        this._canvasElement = new DrawCanvasElement(this);
    }

    /**
     * In order to correctly render z-indexes, Boxes on top of other layers must
     * wipe their backgrounds.  This ensures we don't waste time wiping the background
     * of cells at the lowest level.
     */
    public updateLowestLayer(zIndex: number): void {
        this._lowestLayer = Math.min(this._lowestLayer, zIndex);
    }

    public get lowestLayer() {
        return this._lowestLayer;
    }

    public enqueue(zIndex: number, elem: DomElement, canvas: Canvas): void {
        this._layers[zIndex] = this._layers[zIndex] ?? [];
        this._layers[zIndex].push(() => this.compose(elem, canvas));
    }

    public performOps(): void {
        const layers = Object.keys(this._layers)
            .sort((a, b) => Number(a) - Number(b))
            .map((s) => Number(s));

        for (const layer of layers) {
            this._layers[layer]?.forEach((operation) => operation());
        }
    }

    private compose(elem: DomElement, canvas: Canvas): void {
        if (this.isBoxLike(elem)) {
            this._box.compose(elem, canvas);
        } else if (elem._is(TEXT_ELEMENT)) {
            this._text.compose(elem, canvas);
        } else if (elem._is(CANVAS_ELEMENT)) {
            this._canvasElement.compose(elem, canvas);
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
