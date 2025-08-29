import { DomElement } from "./DomElement.js";
import type { TTagNames } from "../Types.js";
import { type MeasureFunction } from "yoga-wasm-web/auto";
import { getRows } from "../shared/TextWrap.js";
import type { ShadowTextStyle, VirtualTextStyle } from "../style/Style.js";

export class TextElement extends DomElement<VirtualTextStyle, ShadowTextStyle> {
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

    protected override defaultStyles: VirtualTextStyle = { wrap: "wrap" };

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
