import type { MeasureFunction } from "yoga-wasm-web";
import type { Props } from "./props/Props.js";
import type { Style } from "./style/Style.js";
import { DomElement } from "./DomElement.js";

// class TextElement extends DomElement<{ Style: Style.Text; Props: Props.Text }> {
//     protected _textNodes: (string | TextElement)[];
//     protected _start: number;
//     protected _end: number;
//
//     /** @internal */
//     public _slices: { el: TextElement; s: number; e: number }[];
//
//     constructor() {
//         super();
//         this._textNodes = [];
//         this._slices = [];
//         this._start = 0;
//         this._end = 0;
//         this._node.setMeasureFunc(this.getMeasureFunc());
//     }
//
//     protected override get defaultProps(): Props.Text {
//         return {};
//     }
//
//     protected override get defaultStyles(): Style.Text {
//         return { wrap: "wrap" };
//     }
//
//     private clearChildren() {
//         this._textNodes.forEach((node) => {
//             if (typeof node !== "string") this.removeChild(node);
//         });
//     }
//
//     private appendChildren() {
//         this._textNodes.forEach((node) => {
//             if (typeof node !== "string") this.appendChild(node);
//         });
//     }
//
//     public set textContent(value: string | (string | TextElement)[]) {
//         this.clearChildren();
//         this._textNodes = Array.isArray(value) ? value : [value];
//         this.appendChildren();
//     }
//
//     public get textContent() {
//         return this._textNodes.reduce((acc, curr) => {
//             if (typeof curr === "string") {
//                 acc += curr;
//             } else {
//                 return curr.textContent;
//             }
//         }, "");
//     }
//
//     private getMeasureFunc(): MeasureFunction {
//         return (width: number) => {
//             // ----TODO----
//             const height = 1;
//
//             return {
//                 width,
//                 height,
//             };
//         };
//     }
// }
