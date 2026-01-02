import { ActionStore, InputState, type Action } from "term-keymap";
import { INPUT_ELEMENT, type TagNameEnum } from "../Constants.js";
import { DomElement } from "./DomElement.js";
import { TextElement } from "./TextElement.js";
import type { Style } from "./style/Style.js";
import type { Props } from "./props/Props.js";

export class InputElement extends DomElement<{
    Style: Style.Input; // includes TextStyle & BoxStyle
    Props: Props.Input;
}> {
    protected static override identity = INPUT_ELEMENT;

    public hasClaimedStdin: boolean;
    /** @internal */
    public _textEl: TextElement;
    /** @internal */
    public _cursorIdx: number;
    /** @internal */
    private _textContent: string;
    private _inputState: InputState | null;
    private _actionStore: ActionStore;
    private _actionsMap: Map<keyof Props.Input, Action[]>;

    constructor() {
        super();
        this.hasClaimedStdin = false;
        this._inputState = null;
        this._actionStore = new ActionStore();
        this._actionsMap = new Map();
        this._cursorIdx = 0;
        this._textContent = "";
        this._textEl = new TextElement();
        this._textEl.style.wrap = "overflow";
        this._textEl.textContent = this.getRenderedText();
        this.appendChild(this._textEl);
        this.registerProp("enter", this.handleEnter);
        this.registerProp("exit", this.handleExit);
        this.registerProp("cursorLeft", this.handleCursorLeft);
        this.registerProp("cursorRight", this.handleCursorRight);
        this.registerProp("prevWord", this.handlePrevWord);
        this.registerProp("nextWord", this.handleNextWord);
        this.registerProp("deleteWord", this.handleDeleteWord);
        this.registerProp("deleteChar", this.handleDeleteChar);
        this.registerProp("startOfLine", this.handleStartOfLine);
        this.registerProp("endOfLine", this.handleEndOfLine);

        // TODO - Decide how/when to chunk history slices
        // this.registerProp("undoPrev", this.handleUndoPrev);
        // this.registerProp("redoPrev", this.handleRedoPrev);

        this._actionStore.subscribe({
            keymap: { key: "backspace" },
            callback: this.handleBackspace,
        });

        this._actionStore.subscribe({
            keymap: { key: "left" },
            callback: this.handleCursorLeft,
        });

        this._actionStore.subscribe({
            keymap: { key: "right" },
            callback: this.handleCursorRight,
        });

        this._actionStore.subscribe({
            keymap: { key: "tab" },
            name: "tab",
        });
    }

    public override get tagName(): typeof TagNameEnum.Input {
        return "input";
    }

    protected override get defaultStyles(): Style.Input {
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
            deleteChar: [{ key: "alt", input: "x" }],
            startOfLine: [{ key: "alt", input: "0" }],
            endOfLine: [{ key: "alt", input: "A" }],
            tabWidth: 4,
        };
    }

    private registerProp(
        prop: Exclude<keyof Props.TextInput, "enterOnFocus" | "tabWidth">,
        cb: () => unknown,
    ) {
        this.registerPropEffect(prop, (value) => {
            const prev = this._actionsMap.get(prop);
            if (prev) {
                if (prop === "enter") {
                    prev.forEach((action) => this.removeKeyListener(action));
                } else {
                    this._actionStore.unsubscribe(...prev);
                }
            }

            this._actionsMap.delete(prop);
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
                this._actionStore.subscribe(...actions);
            }
        });
    }

    /** @internal */
    public handleData(buf: Buffer) {
        if (!this._inputState) {
            return;
        }

        const actions = this._actionStore.getActions();
        const { keymap, data } = this._inputState.process(buf, actions);

        const isTab = data.key.has("tab");
        if (keymap) return;
        if (data.key.size && !isTab) return;

        const utf = isTab ? " ".repeat(this.getProp("tabWidth") ?? 4) : data.raw.utf;
        const prevText = this.textContent;
        const nextText =
            prevText.slice(0, this._cursorIdx) + utf + prevText.slice(this._cursorIdx);
        this._cursorIdx += utf.length;

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
        this._textEl.textContent = this.getRenderedText();
    }

    private cursorLeft(units: number) {
        const prev = this._cursorIdx;
        const next = Math.max(0, this._cursorIdx - units);
        if (prev !== next) {
            this._cursorIdx = next;
            this.getRoot()?.scheduleRender();
            this.adjustOffsetToCursor();
        }
    }

    private cursorRight(units: number) {
        const prevCursor = this._cursorIdx;
        const nextCursor = Math.min(this.textContent.length, this._cursorIdx + units);

        if (prevCursor !== nextCursor) {
            this._cursorIdx = nextCursor;
            this.getRoot()?.scheduleRender();
            this.adjustOffsetToCursor();
        }
    }

    /**
     * If the cursor is no longer visible, we need to adjust the offset
     * */
    private adjustOffsetToCursor() {
        this.afterLayout({
            subscribe: false,
            handler: () => {
                // Adjust the idx to its position relative to the content window
                const idx = this._cursorIdx + this._scrollOffset.x;
                const max = this.unclippedContentRect.width - 1;
                if (idx > max) {
                    this.scrollRight(idx - max);
                    return true;
                } else if (idx < 0) {
                    this.scrollLeft(Math.abs(idx));
                    return true;
                }
                return false;
            },
        });
    }

    public handleEnter = () => {
        if (this.getRoot()?.requestInputStreamOwnership(this)) {
            this.getRoot()?.scheduleRender();
            this.hasClaimedStdin = true;
            this._inputState = new InputState();
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
        const prev = this._cursorIdx;

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
        const prev = this._cursorIdx;

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
        const curr = this._cursorIdx;

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

    private handleDeleteChar = () => {
        const tc = this.textContent;
        const curr = this._cursorIdx;
        const nextTc = tc.slice(0, curr) + tc.slice(curr + 1);
        this.textContent = nextTc;
        if (curr >= nextTc.length) {
            this.cursorLeft(1);
        }
    };

    private handleBackspace = () => {
        const tc = this.textContent;
        const curr = this._cursorIdx;
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
