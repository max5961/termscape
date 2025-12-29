import { DomElement } from "./DomElement.js";
import { type MeasureFunction } from "yoga-wasm-web/auto";
import {
    alignRows,
    getAlignedRows,
    getRows,
    shouldTreatAsBreak,
} from "../shared/TextWrap.js";
import type { TextStyle } from "../style/Style.js";
import type { BaseProps, Props } from "../Props.js";
import { Render } from "./util/decorators.js";
import type { TagNameEnum } from "../Constants.js";
import { TEXT_ELEMENT } from "../Constants.js";

export class TextElement extends DomElement<{
    Style: TextStyle;
    Props: Props.Text;
}> {
    protected static override identity = TEXT_ELEMENT;

    private _textContent: string;
    public textHeight!: number;
    /** @internal */
    public rows!: ReturnType<typeof getRows>;
    /** @internal */
    public alignedRows!: ReturnType<typeof getAlignedRows>;
    /** @internal */
    public bufferIdx!: number;
    /** @internal */
    public requestedDepth!: number;
    /**
     * @internal
     *
     * Implicit wrap style exists because if a style of 'overflow' is set, but
     * the text contains breaking characters, then it needs to be wrapped to
     * determine the height in the measureFunc.  Intentional overflow with
     * breaking chars would be an edge use case and not supported.
     * */
    public implicitWrapStyle: "overflow" | "wrap";

    constructor() {
        super();
        this._textContent = "";
        this.style = this.defaultStyles;
        this.initBuffer();
        this.implicitWrapStyle = "overflow";
        this.node.setMeasureFunc(this.getMeasureFunc());
    }

    private initBuffer() {
        this.rows = [];
        this.alignedRows = [];
        this.textHeight = 0;
        this.bufferIdx = 0;
        this.requestedDepth = 2000;
    }

    /** @internal */
    public static LargeTextRows = 2000;

    public override get tagName(): typeof TagNameEnum.Text {
        return "text";
    }

    protected override get defaultStyles(): TextStyle {
        return { wrap: "wrap" };
    }
    protected override get defaultProps(): BaseProps {
        return {};
    }

    public get textContent() {
        return this._textContent;
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
        this.initBuffer();
    }

    private getMeasureFunc(): MeasureFunction {
        return (width: number) => {
            this.rows = getRows(this.textContent, width);
            this.alignedRows = alignRows(this.rows, width, this.shadowStyle.align);

            if (this.style.wrap !== "wrap" || this.textContent.length <= width) {
                this.textHeight = 1;
            } else if (width <= 0) {
                this.textHeight = this.textContent.length;
            } else {
                this.textHeight = this.rows.length;
            }

            return {
                width: Math.min(this.textContent.length, width),
                height: this.textHeight,
            };
        };
    }

    private appendNextChunk = (width: number) => {
        const nextText = this.textContent.slice(this.bufferIdx);
        const stopRows = this.requestedDepth - this.alignedRows.length;

        const nextBufStop = { idx: 0 };
        const nextRows = getRows(nextText, width, nextBufStop, stopRows);
        const nextAlignedRows = alignRows(nextRows, width, this.shadowStyle.align);

        this.alignedRows = [...this.alignedRows, ...nextAlignedRows];
        this.bufferIdx += nextBufStop.idx;
        this.textHeight = this.alignedRows.length;

        // ***** WIP - for measureFunc *****
        // const breakingChars = this.hasBreakingChars();
        // if (
        //     (!breakingChars && this.style.wrap !== "wrap") ||
        //     this.textContent.length <= width
        // ) {
        //     this.textHeight = 1;
        //     this.implicitWrapStyle = "overflow";
        // } else if (width <= 0) {
        //     this.textHeight = this.textContent.length;
        //     // cannot draw
        // } else {
        //     this.appendNextChunk(width);
        //     this.implicitWrapStyle = "wrap";
        // }
    };

    private hasBreakingChars() {
        for (let i = 0; i < this.textContent.length; ++i) {
            if (shouldTreatAsBreak(this.textContent[i])) {
                return true;
            }
        }
        return false;
    }
}
