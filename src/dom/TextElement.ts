import { DomElement } from "./DomElement.js";
import type { TTagNames, TextStyle } from "../Types.js";
import { type MeasureFunction } from "yoga-wasm-web/auto";
import { getRows } from "../shared/TextWrap.js";

export class TextElement extends DomElement<TextStyle, TextStyle> {
    private _textContent: string;
    public tagName: TTagNames;
    public textHeight: number;

    constructor() {
        super();
        this.tagName = "TEXT_ELEMENT";
        this._textContent = "";
        this.node.setMeasureFunc(this.getMeasureFunc());
        this.style = this.defaultStyles;
        this.textHeight = 0;
    }

    protected override defaultStyles: TextStyle = { wrap: "wrap" };

    public set textContent(val: string) {
        this._textContent = val;
    }

    public get textContent() {
        return this._textContent;
    }

    private getMeasureFunc(): MeasureFunction {
        return (width: number) => {
            if (this.style.wrap !== "wrap" || this.textContent.length <= width) {
                this.textHeight = 1;
            } else if (width <= 0) {
                this.textHeight = this.textContent.length;
            } else {
                this.textHeight = getRows(this.textContent, width).length;
            }

            return {
                width: width,
                height: this.textHeight,
            };
        };
    }
}
