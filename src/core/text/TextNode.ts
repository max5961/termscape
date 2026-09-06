import type { IAnsiEffectStyle } from "../style/IStyle.js";
import { throwError } from "../Errors.js";
import type { CoreTextElement } from "./CoreTextElement.js";
import { StateChange } from "../renderer/RenderStateChange.js";

/**
 * Text is nothing more than a data structure to attach style metadata to a string.
 * */
export class Text {
    protected core: CoreTextElement | undefined;
    protected _content: string;
    private _original: IAnsiEffectStyle;
    private _style: IAnsiEffectStyle;

    constructor(style: IAnsiEffectStyle, content: string) {
        this._original = { ...style };
        this._style = style;
        this._content = content;
    }

    public get style() {
        return this._style;
    }
    public set style(style) {
        this._original = style;
        this.mutation(StateChange.Style);
    }

    public get content() {
        return this._content;
    }
    public set content(text) {
        this._content = text;
        this.mutation(StateChange.Layout);
    }

    public mergeStyle(ancestor: IAnsiEffectStyle) {
        this._style = {
            ...ancestor,
            ...this._style,
        };
    }

    public setToPreInheritedStyle() {
        this._style = { ...this._original };
    }

    public setCore(core: CoreTextElement | undefined) {
        this.core = core;
    }

    private mutation(change: StateChange) {
        this.core?.childMutation(change);
    }
}

export interface ITextNode {
    append(child: Text | TextNode): TextNode;
    remove(child: Text | TextNode): void;
}

/**
 * TextNode is essentially the recursive composable version of Text.  Its purpose
 * is to compose through primitive Text leaf nodes and cannot contain text content
 * itself.
 * */
export class TextNode extends Text implements ITextNode {
    protected declare readonly _content = "";
    private children: (Text | TextNode)[];

    constructor(style: IAnsiEffectStyle) {
        super(style, "");
        this.children = [];
    }

    public append(text: string | Text | TextNode, style: IAnsiEffectStyle = {}): TextNode {
        if (typeof text === "string") {
            text = new Text(style, text);
        }
        this.children.push(text);
        return this;
    }

    public remove(child: Text | TextNode): void {
        const idx = this.children.indexOf(child);
        if (idx < 0) {
            throwError(m => m.textNodeRemove.childNotChild);
        }

        this.children[idx].setToPreInheritedStyle();
        this.children.splice(idx, 1)

    }

    public flatten(memo: Text[] = []) {
        for (const child of this.children) {
            child.mergeStyle(this.style);

            if (child instanceof TextNode) {
                child.flatten(memo);
            } else {
                memo.push(child);
            }
        }
        return memo;
    }

    public __flattenToTestable() {
        return this.flatten().map((text) => {
            return { text: text.content, style: text.style };
        });
    }

    public override setToPreInheritedStyle(): void {
        super.setToPreInheritedStyle();
        this.children.forEach(c => c.setToPreInheritedStyle());
    }

    public override setCore(core: CoreTextElement | undefined): void {
        super.setCore(core);
        this.children.forEach(c => c.setCore(core));
    }
}

// prettier-ignore
// const node = new TextNode({})
//     .append("foo", { bold: true })
//     .append(new TextNode({})
//         .append("bar", { italic: true }));
