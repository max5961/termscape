import { DomElement } from "./DomElement.js";
import { type MeasureFunction } from "yoga-wasm-web/auto";
import { getRows } from "../shared/TextWrap.js";
import type { TextStyle } from "../style/Style.js";
import type { BaseProps } from "../Props.js";
import { Render } from "./util/decorators.js";
import type { TagNameEnum } from "../Constants.js";

export class TextElement extends DomElement<{
    Style: TextStyle;
    Props: BaseProps;
}> {
    private _textContent: string;
    public textHeight: number;

    constructor() {
        super();
        this._textContent = "";
        this.node.setMeasureFunc(this.getMeasureFunc());
        // this.style = this.defaultStyles;
        this.textHeight = 0;
    }

    public override get tagName(): typeof TagNameEnum.Text {
        return "text";
    }

    protected override get defaultStyles(): TextStyle {
        return { wrap: "wrap" };
    }
    protected override get defaultProps(): BaseProps {
        return {};
    }

    public set textContent(val: string) {
        if (val !== this._textContent) {
            this.setTextContext(val);
        }
    }

    private setTextContext(val: string): void {
        if (this._textContent === val) return;
        this.setTextContentWithRender(val);
    }

    @Render({ layoutChange: true })
    private setTextContentWithRender(val: string): void {
        this._textContent = val;
        this.node.markDirty(); // Yoga will not run the measureFunc otherwise
    }

    public get textContent() {
        return this._textContent;
    }

    private getMeasureFunc(): MeasureFunction {
        return (width: number) => {
            // TODO - *fast* function to see if textContent contains breaking
            // characters to force wrap no matter what.  Not too important because
            // if rendering text from a file you're probably not going to want it
            // all on 1 line.
            if (this.style.wrap !== "wrap" || this.textContent.length <= width) {
                this.textHeight = 1;
            } else if (width <= 0) {
                this.textHeight = this.textContent.length;
            } else {
                this.textHeight = getRows(this.textContent, width).length;
            }

            return {
                width: Math.min(this.textContent.length, width),
                height: this.textHeight,
            };
        };
    }
}
