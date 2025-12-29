import { ActionStore, InputState } from "term-keymap";
import { INPUT_ELEMENT, type TagNameEnum } from "../Constants.js";
import type { BaseProps, BoxLikeProps, InputElementProps, Props } from "../Props.js";
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

    /** @internal */
    public hasClaimedStdin: boolean;

    constructor() {
        super();
        this.value = "";
        this.cursorIdx = 0;
        this.hasClaimedStdin = false;
        this.inputState = null;
        this.actionStore = new ActionStore();
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

    // public override setProp<T extends keyof Props.Input>(
    //     key: T,
    //     value: Props.Input[T],
    // ): void {
    //     super.setProp(key, value);
    //
    //     // for now - todo - make this hashable to inlcude all possibly props
    //     if (key === "exit") {
    //         this.actionStore.subscribe({
    //             keymap: value as Props.Input["exit"],
    //             callback: this.handleExit,
    //         });
    //     }
    //     if (key === "enter") {
    //         this.addKeyListener({
    //             keymap: value as Props.Input["enter"],
    //             callback: this.handleEnter,
    //         });
    //     }
    // }

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

    public handleEnter = () => {
        this.getRoot()?.requestInputStreamOwnership(this);
        this.inputState = new InputState();
    };

    private handleExit = () => {
        this.getRoot()?.forfeitInputStreamOwnership(this);
    };
}
