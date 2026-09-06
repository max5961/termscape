import { DefaultStyles } from "../../dom/DefaultStyles.js";
import type { DomElement } from "../../dom/DomElement.js";
import { CoreElement } from "../CoreElement.js";
import { StateChange } from "../renderer/RenderStateChange.js";
import { Text, TextNode } from "./TextNode.js";
import type { MeasureFunction } from "yoga-wasm-web";
import { textWrap } from "./textwrap.js";

export class CoreTextElement extends CoreElement {
    private textNode: TextNode;
    private readonly wrapped: Map<number, string[]>;
    private flattened: Text[] | undefined;

    constructor(shell: DomElement) {
        super(shell, DefaultStyles.Text);
        this.textNode = new TextNode({});
        this.wrapped = new Map();
        this.yogaNode.setMeasureFunc(this.setMeasureFunc);
    }

    public set textContent(text: Text | TextNode) {
        this.flattened = undefined;
        this.textNode.setCore(undefined);

        if (text instanceof TextNode) {
            this.textNode = text;
        } else {
            this.textNode = new TextNode({});
            this.textNode.append(text);
        }
        this.textNode.setCore(this);
        this.root.scheduleRender(StateChange.Layout);
    }

    public childMutation(change: StateChange) {
        if (change & StateChange.Layout) {
            this.wrapped.clear();
        }
        this.flattened = undefined;
        this.root.scheduleRender(change);
    }

    private setMeasureFunc: MeasureFunction = (width: number) => {
        if (!this.flattened) {
            this.flattened = this.textNode.flatten();
        }
        if (this.wrapped.get(width)) {
            return {
                width,
                height: this.wrapped.get(width)!.length,
            };
        }

        const expanded = this.expandFlattened(this.flattened);
        this.wrapped.set(width, textWrap(expanded, width));
        return {
            width,
            height: this.wrapped.get(width)!.length,
        };
    };

    private expandFlattened(flattened: Text[]): string {
        let raw = "";
        flattened.forEach((text) => {
            raw += text.content;
        });
        return raw;
    }
}
