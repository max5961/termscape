import { DomElement } from "./DomElement.js";
import type { TTagNames, TextStyle } from "../Types.js";
import { type MeasureFunction } from "yoga-wasm-web/auto";
import { getRows } from "../shared/TextWrap.js";

export class TextElement extends DomElement<TextStyle, TextStyle> {
    private _textContent: string;
    public tagName: TTagNames;

    constructor() {
        super();
        this.tagName = "TEXT_ELEMENT";
        this._textContent = "";
        this.node.setMeasureFunc(this.getMeasureFunc());
        this.style = this.defaultStyles;
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
                return {
                    width: width,
                    height: 1,
                };
            }

            if (width <= 0) {
                return {
                    width: width,
                    height: this.textContent.length,
                };
            }

            return {
                width: width,
                height: getRows(this.textContent, width).length,
            };
        };
    }
}
