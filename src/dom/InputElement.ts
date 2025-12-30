import { ActionStore, InputState, type Action } from "term-keymap";
import { INPUT_ELEMENT, type TagNameEnum } from "../Constants.js";
import type { InputElementProps, Props } from "../Props.js";
import type { BaseStyle } from "../style/Style.js";
import { DomElement } from "./DomElement.js";
import { logger } from "../shared/Logger.js";

export class InputElement extends DomElement<{
    Style: BaseStyle; // includes TextStyle & BoxStyle
    Props: Props.Input;
}> {
    protected static override identity = INPUT_ELEMENT;

    public value: string;
    private cursorIdx: number;
    private inputState: InputState | null;
    private actionStore: ActionStore;
    private actionsMap: Partial<Record<keyof Props.Input, Action>>;

    /** @internal */
    public hasClaimedStdin: boolean;

    constructor() {
        super();
        this.value = "";
        this.cursorIdx = 0;
        this.hasClaimedStdin = false;
        this.inputState = null;
        this.actionStore = new ActionStore();
        this.actionsMap = {};
        this.registerEffects();
    }

    public override get tagName(): typeof TagNameEnum.Input {
        return "input";
    }

    protected override get defaultStyles(): BaseStyle {
        return {
            width: "100",
            height: 1,
        };
    }

    protected override get defaultProps(): Props.Input {
        return {
            enter: "<CR>",
            exit: "<Esc>",
        };
    }

    /** @internal */
    public handleData(buf: Buffer) {
        // devel
        if (buf[0] === 3) this.getRoot()?.exit();

        if (this.inputState) {
            const actions = this.actionStore.getActions();
            const state = this.inputState.process(buf, actions);

            logger.write({ data: state.data });
        }
    }

    private registerEffects() {
        this.registerPropEffect("enter", (value) => {
            const prev = this.actionsMap.enter;
            if (prev) {
                this.actionStore.unsubscribe(prev);
            }
            this.actionsMap.enter = undefined;
            if (value) {
                this.actionsMap.enter = { keymap: value, callback: this.handleEnter };
                this.addKeyListener(this.actionsMap.enter);
            }
        });

        const registerInpLsr = (prop: keyof InputElementProps, cb: () => unknown) => {
            this.registerPropEffect(prop, (value) => {
                if (this.actionsMap[prop]) {
                    this.actionStore.unsubscribe(this.actionsMap[prop]);
                }

                if (value) {
                    this.actionsMap[prop] = { keymap: value, callback: cb };
                    this.actionStore.subscribe(this.actionsMap[prop]);
                }
            });
        };

        registerInpLsr("exit", this.handleExit);
        // ...TODO
        // registerInpLsr("nextWord", this.handleNextWord);
        // registerInpLsr("prevWord", this.handlePrevWord);
        // registerInpLsr("cursorLeft", this.handleCursorLeft);
        // registerInpLsr("cursorRight", this.handleCursorRight);
        // registerInpLsr("deleteWord", this.handleDeleteWord);
        // registerInpLsr("undoPrev", this.handleUndoPrev);
        // registerInpLsr("redoPrev", this.handleRedoPrev);
    }

    public handleEnter = () => {
        this.getRoot()?.requestInputStreamOwnership(this);
        this.inputState = new InputState();
    };

    private handleExit = () => {
        this.getRoot()?.forfeitInputStreamOwnership(this);
    };
}
