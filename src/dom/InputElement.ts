import { ActionStore, InputState, type Action } from "term-keymap";
import { INPUT_ELEMENT, type TagNameEnum } from "../Constants.js";
import type { InputElementProps, Props } from "../Props.js";
import type { BaseStyle } from "../style/Style.js";
import { DomElement } from "./DomElement.js";
import { TextElement } from "./TextElement.js";

export class InputElement extends DomElement<{
    Style: BaseStyle; // includes TextStyle & BoxStyle
    Props: Props.Input;
}> {
    protected static override identity = INPUT_ELEMENT;

    /** @internal */
    public textElement: TextElement;
    /** @internal */
    public cursorIdx: number;
    /** @internal */
    public hasClaimedStdin: boolean;
    private _textContent: string;
    private inputState: InputState | null;
    private actionStore: ActionStore;
    private actionsMap: Map<keyof Props.Input, Action[]>;

    constructor() {
        super();
        this.hasClaimedStdin = false;
        this.inputState = null;
        this.actionStore = new ActionStore();
        this.actionsMap = new Map();
        this.cursorIdx = 0;
        this._textContent = "";
        this.textElement = new TextElement();
        this.textElement.style.wrap = "overflow";
        this.textElement.textContent = this.getRenderedText();
        this.appendChild(this.textElement);
        this.registerProp("enter", this.handleEnter);
        this.registerProp("exit", this.handleExit);
        this.registerProp("cursorLeft", this.handleCursorLeft);
        this.registerProp("cursorRight", this.handleCursorRight);
        this.registerProp("prevWord", this.handlePrevWord);
        this.registerProp("nextWord", this.handleNextWord);
        this.registerProp("deleteWord", this.handleDeleteWord);
        this.registerProp("startOfLine", this.handleStartOfLine);
        this.registerProp("endOfLine", this.handleEndOfLine);

        // TODO - Decide how/when to chunk history slices
        // this.registerProp("undoPrev", this.handleUndoPrev);
        // this.registerProp("redoPrev", this.handleRedoPrev);

        this.actionStore.subscribe({
            keymap: { key: "backspace" },
            callback: this.handleBackspace,
        });

        this.actionStore.subscribe({
            keymap: { key: "left" },
            callback: this.handleCursorLeft,
        });

        this.actionStore.subscribe({
            keymap: { key: "right" },
            callback: this.handleCursorRight,
        });

        this.actionStore.subscribe({
            keymap: { key: "tab" },
            name: "tab",
        });
    }

    public override get tagName(): typeof TagNameEnum.Input {
        return "input";
    }

    protected override get defaultStyles(): BaseStyle {
        return {
            width: "100",
            height: 1,
            overflow: "scroll",
        };
    }

    protected override get defaultProps(): Props.Input {
        return {
            enter: [{ key: "return" }],
            exit: [{ key: "esc" }, { key: "return" }],
            cursorLeft: [{ key: "alt", input: "h" }],
            cursorRight: [{ key: "alt", input: "l" }],
            prevWord: [{ key: "alt", input: "b" }],
            nextWord: [{ key: "alt", input: "w" }],
            deleteWord: [{ key: "alt", input: "d" }],
            startOfLine: [{ key: "alt", input: "0" }],
            endOfLine: [{ key: "alt", input: "A" }],
            tabWidth: 4,
        };
    }

    private registerProp(
        prop: Exclude<keyof InputElementProps, "enterOnFocus" | "tabWidth">,
        cb: () => unknown,
    ) {
        this.registerPropEffect(prop, (value) => {
            const prev = this.actionsMap.get(prop);
            if (prev) {
                if (prop === "enter") {
                    prev.forEach((action) => this.removeKeyListener(action));
                } else {
                    this.actionStore.unsubscribe(...prev);
                }
            }

            this.actionsMap.delete(prop);
            if (!value) return;
            const actions: Action[] = value.map((keymap) => {
                return {
                    keymap: keymap,
                    callback: cb,
                };
            });

            if (prop === "enter") {
                actions.forEach((action) => this.addKeyListener(action));
            } else {
                this.actionStore.subscribe(...actions);
            }
        });
    }

    // We are getting double renders and its because of the afterLayout function
    // to adjust the scroll to fit the cursor.
    //
    // We could make a special function just for InputElement, OR we could
    // give an option for afterLayout to ALWAYS force a recomposite without
    // going through the render process on the next tick.  For example, instead of
    // returning a Promise, it returns a boolean.  If true, then recomposite during
    // that cycle before rendering, if false then disregard.

    /** @internal */
    public handleData(buf: Buffer) {
        if (!this.inputState) {
            return;
        }

        const actions = this.actionStore.getActions();
        const { keymap, data } = this.inputState.process(buf, actions);

        const isTab = data.key.has("tab");
        if (keymap) return;
        if (data.key.size && !isTab) return;

        const utf = isTab ? " ".repeat(this.getProp("tabWidth") ?? 4) : data.raw.utf;
        const prevText = this.textContent;
        const nextText =
            prevText.slice(0, this.cursorIdx) + utf + prevText.slice(this.cursorIdx);
        this.cursorIdx += utf.length;

        this.textContent = nextText;
        this.adjustOffsetToCursor();
    }

    private getRenderedText() {
        return this._textContent + " ";
    }

    private get textContent() {
        return this._textContent;
    }

    private set textContent(value: string) {
        this._textContent = value;
        this.textElement.textContent = this.getRenderedText();
    }

    private cursorLeft(units: number) {
        const prev = this.cursorIdx;
        const next = Math.max(0, this.cursorIdx - units);
        if (prev !== next) {
            this.cursorIdx = next;
            this.getRoot()?.scheduleRender();
            this.adjustOffsetToCursor();
        }
    }

    private cursorRight(units: number) {
        const prevCursor = this.cursorIdx;
        const nextCursor = Math.min(this.textContent.length, this.cursorIdx + units);

        if (prevCursor !== nextCursor) {
            this.cursorIdx = nextCursor;
            this.getRoot()?.scheduleRender();
            this.adjustOffsetToCursor();
        }
    }

    /**
     * If the cursor is no longer visible, we need to adjust the offset
     * */
    private adjustOffsetToCursor() {
        // this.afterLayout().then(() => {
        //     const offX = this.scrollOffset.x;
        //     const maxWidth = this.unclippedContentRect.width;
        //     const cursorIdx = this.cursorIdx;
        //
        //     if (!offX) {
        //         if (cursorIdx >= maxWidth) {
        //             this.scrollRight(cursorIdx - maxWidth + 1);
        //         }
        //     } else if (offX < 0) {
        //         const adjCursorIdx = cursorIdx + offX;
        //         if (adjCursorIdx >= maxWidth) {
        //             this.scrollRight(adjCursorIdx - maxWidth + 1);
        //         } else if (adjCursorIdx < 0) {
        //             this.scrollLeft(-adjCursorIdx);
        //         }
        //     }
        // });
        this.forceRecomposite(() => {
            const offX = this.scrollOffset.x;
            const maxWidth = this.unclippedContentRect.width;
            const cursorIdx = this.cursorIdx;

            if (!offX) {
                if (cursorIdx >= maxWidth) {
                    this.scrollRight(cursorIdx - maxWidth + 1);
                }
            } else if (offX < 0) {
                const adjCursorIdx = cursorIdx + offX;
                if (adjCursorIdx >= maxWidth) {
                    this.scrollRight(adjCursorIdx - maxWidth + 1);
                } else if (adjCursorIdx < 0) {
                    this.scrollLeft(-adjCursorIdx);
                }
            }
            return true;
        });
    }

    public handleEnter = () => {
        if (this.getRoot()?.requestInputStreamOwnership(this)) {
            this.getRoot()?.scheduleRender();
            this.hasClaimedStdin = true;
            this.inputState = new InputState();
            this.cursorRight(Infinity); // go to end of text when entering
        }
    };

    private handleExit = () => {
        this.getRoot()?.forfeitInputStreamOwnership(this);
        this.getRoot()?.scheduleRender();
        this.hasClaimedStdin = false;
        this.cursorLeft(Infinity);
    };

    private handleCursorLeft = () => {
        this.cursorLeft(1);
    };

    private handleCursorRight = () => {
        this.cursorRight(1);
    };

    private handlePrevWord = () => {
        const tc = this.textContent;
        const prev = this.cursorIdx;

        let curr = prev;
        let inws = tc[curr] === " " || tc[curr - 1] === " ";
        while (curr-- > 0) {
            if (inws && tc[curr] !== " ") {
                inws = false;
                continue;
            }
            if (!inws && tc[curr - 1] === " ") {
                break;
            }
        }

        this.cursorLeft(prev - curr);
    };

    private handleNextWord = () => {
        const tc = this.textContent;
        const prev = this.cursorIdx;

        let curr = prev;
        let inword = tc[curr] !== " ";
        while (curr++ < tc.length) {
            if (inword && tc[curr] === " ") {
                inword = false;
                continue;
            }
            if (!inword && tc[curr] !== " ") {
                break;
            }
        }

        this.cursorRight(curr - prev);
    };

    private handleDeleteWord = () => {
        const tc = this.textContent;
        const curr = this.cursorIdx;

        if (tc[curr] === " ") return; // in ws

        let left = curr;
        let right = curr;
        while (tc[left] && tc[left] !== " ") --left;
        while (tc[right] && tc[right] !== " ") ++right;
        left = Math.max(0, left + 1);

        this.handlePrevWord(); // go to beginning of word pre-delete
        const nextTc = tc.slice(0, left) + tc.slice(right);
        this.textContent = nextTc;
    };

    private handleBackspace = () => {
        const tc = this.textContent;
        const curr = this.cursorIdx;
        if (curr === 0) return;

        const nextTc = tc.slice(0, curr - 1) + tc.slice(curr);
        this.cursorLeft(1);
        this.textContent = nextTc;
    };

    private handleStartOfLine = () => {
        this.cursorLeft(Infinity);
    };

    private handleEndOfLine = () => {
        this.cursorRight(Infinity);
    };
}
