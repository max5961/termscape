import { DomElement } from "./DomElement.js";
import { type MeasureFunction } from "yoga-wasm-web/auto";
import {
    alignRows,
    getAlignedRows,
    getRows,
    shouldTreatAsBreak,
} from "../shared/TextWrap.js";
import type { Style } from "./style/Style.js";
import type { Props } from "./props/Props.js";
import { Render } from "./util/decorators.js";
import { TagNameEnum, TEXT_NODE, Yg } from "../Constants.js";
import { TEXT_ELEMENT } from "../Constants.js";
import { objectEntries } from "../Util.js";

export type TextContentNode = string | TextNode;
export type TextContent = string | TextContentNode[];

export class TextElement extends DomElement<{ Style: Style.Text; Props: Props.Text }> {
    protected static override identity = TEXT_ELEMENT;

    protected _childTextNodes: Set<TextNode>;
    protected _textNodes: (string | TextNode)[];
    /** @internal */
    public _rows!: ReturnType<typeof getRows>;
    /** @internal */
    public _alignedRows!: ReturnType<typeof getAlignedRows>;
    /** @internal */
    public _textHeight: number;
    /** @internal */
    public _singleLine: boolean;

    constructor() {
        super();
        this._childTextNodes = new Set();
        this._textNodes = [];
        this._rows = [];
        this._alignedRows = [];
        this._textHeight = 0;
        this._singleLine = false;
        if (!this.isTextNode) {
            this._node.setMeasureFunc(this.getMeasureFunc());
        }
    }

    public override get tagName(): typeof TagNameEnum.Text {
        return TagNameEnum.Text;
    }

    protected override get defaultProps(): Props.Text {
        return {};
    }

    protected override get defaultStyles(): Style.Text {
        return { wrap: "wrap" };
    }

    protected get isTextNode() {
        return false;
    }

    protected findRootText(): TextElement | undefined {
        const parent = this.parentElement;
        if (!parent || !parent._is(TEXT_NODE)) {
            return !this._is(TEXT_NODE) ? this : undefined;
        }
        return parent.findRootText();
    }

    protected ifRoot(cb: () => unknown) {
        if (this.findRootText() === this) {
            cb();
        }
    }

    private clearChildren() {
        this._childTextNodes.forEach((node) => this._childTextNodes.delete(node));
    }

    private appendChildren() {
        this._textNodes.forEach((node) => {
            if (typeof node !== "string") {
                this._childTextNodes.add(node);
            }
        });
    }

    public set textContent(value: TextContent) {
        if (!this._childSet.size && typeof value === "string") {
            if (this.textContent === value) return;
        }
        this.setTextContentWithRender(value);
    }

    @Render({ layoutChange: true })
    public setTextContentWithRender(value: TextContent) {
        this.ifRoot(() => this._node.markDirty());

        this.clearChildren();
        this._textNodes = Array.isArray(value) ? value : [value];
        this.appendChildren();
    }

    public get textContent(): string {
        return this._textNodes.reduce((acc: string, curr) => {
            if (typeof curr === "string") {
                return acc + curr;
            } else {
                return acc + curr.textContent;
            }
        }, "");
    }

    /** @internal */
    public _getSlices(): [TextElement["_shadowStyle"], number, string][] {
        const slices = this.getIndexSlices();
        const styleMap = this.getStyleMap();

        return slices.map((slice) => {
            const [el, stop, text] = slice;
            return [styleMap.get(el)!, stop, text];
        });
    }

    private getIndexSlices(idx = { ref: 0 }): [TextElement, number, string][] {
        return this._textNodes.reduce((acc: [TextElement, number, string][], curr) => {
            if (typeof curr === "string") {
                idx.ref += curr.length;
                return [...acc, [this, idx.ref, curr]];
            } else {
                return [...acc, ...curr.getIndexSlices(idx)];
            }
        }, []);
    }

    private getStyleMap(
        map?: Map<TextElement, TextElement["_shadowStyle"]>,
        style?: TextElement["_shadowStyle"],
    ): Map<TextElement, TextElement["_shadowStyle"]> {
        style ??= { ...this._shadowStyle };
        map ??= new Map();
        map.set(this, style);

        this._textNodes.forEach((node) => {
            if (typeof node !== "string") {
                const childStyle = { ...node.style };
                objectEntries(style).forEach(([k, v]) => {
                    // @ts-ignore
                    if (childStyle[k] === undefined) childStyle[k] = v;
                });
                node.getStyleMap(map, childStyle);
            }
        });

        return map;
    }

    private getMeasureFunc(): MeasureFunction {
        return (width: number) => {
            if (this.parentElement?._is(TEXT_ELEMENT)) {
                return { width: 0, height: 0 };
            }

            const style = this._shadowStyle;
            const tc = this.textContent;
            const nowrap = tc.length < width || style.wrap === "overflow";

            if (nowrap && !this.hasBreakingChars(tc)) {
                this._singleLine = true;
                this._textHeight = 1;
                this._rows = [tc];
                this._alignedRows = alignRows(this._rows, width, style.align);
                const height = this._textHeight;
                return { width, height };
            }

            // Non-Drawable
            if (width <= 0) {
                this._textHeight = tc.length;
                this._rows = [];
                this._alignedRows = [];
                return { width: 0, height: this._textHeight };
            }

            this._singleLine = false;
            this._rows = getRows(tc, width);
            this._alignedRows = alignRows(this._rows, width, style.align);
            this._textHeight = this._rows.length;
            return {
                width: width,
                height: this._textHeight,
            };
        };
    }

    private hasBreakingChars(tc: string) {
        for (let i = 0; i < tc.length; ++i) {
            if (shouldTreatAsBreak(tc[i])) return true;
        }
        return false;
    }

    // TODO - Buffer Large Text
    // private initBuffer() {
    //     this._rows = [];
    //     this._alignedRows = [];
    //     this._textHeight = 0;
    //     this._bufferIdx = 0;
    //     this._requestedDepth = 2000;
    // }
    //
    // /** @internal */
    // public static LargeTextRows = 2000;
    //
    // private appendNextChunk = (width: number) => {
    //     const nextText = this.textContent.slice(this.bufferIdx);
    //     const stopRows = this.requestedDepth - this.alignedRows.length;
    //
    //     const nextBufStop = { idx: 0 };
    //     const nextRows = getRows(nextText, width, nextBufStop, stopRows);
    //     const nextAlignedRows = alignRows(nextRows, width, this._shadowStyle.align);
    //
    //     this.alignedRows = [...this.alignedRows, ...nextAlignedRows];
    //     this.bufferIdx += nextBufStop.idx;
    //     this.textHeight = this.alignedRows.length;
    // };
}

export class TextNode extends TextElement {
    protected static override identity = TEXT_NODE;

    constructor(style: Style.Text, textContent: TextContent) {
        super();
        this._node.setHeight(0);
        this._node.setWidth(0);
        this._node.setDisplay(Yg.DISPLAY_NONE);

        this.style = style;
        this.textContent = textContent;
    }

    protected override get isTextNode(): boolean {
        return true;
    }
}
