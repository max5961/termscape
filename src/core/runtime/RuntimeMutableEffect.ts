import type { StdoutLike } from "../../Types.js";
import { Ansi } from "../Ansi.js";
import type { CoreRootElement } from "../CoreRootElement.js";
import { StateChange } from "../renderer/RenderStateChange.js";
import { RuntimeEffect, type RuntimeOperations } from "./RuntimeEffect.js";

export interface IRuntimeMutableEffect {
    altScreen: boolean;
}

export class RuntimeMutableEffect extends RuntimeEffect<IRuntimeMutableEffect> {
    private stdout: StdoutLike;
    private root: CoreRootElement;

    constructor(root: CoreRootElement, stdout: StdoutLike) {
        super();
        this.root = root;
        this.stdout = stdout;
    }

    protected override initialState: IRuntimeMutableEffect = {
        altScreen: false,
    };

    protected override operations: RuntimeOperations<IRuntimeMutableEffect> = {
        altScreen: {
            set: (v) => {
                return v ? this.enterAltScreen() : this.exitAltScreen();
            },
            disable: () => {
                return this.exitAltScreen();
            },
        },
    };

    private enterAltScreen = () => {
        this.stdout.write(Ansi.enterAltScreen);
        this.stdout.write(Ansi.cursor.position(0, 0));
        this.root.scheduleRender(StateChange.Screen);
    };

    private exitAltScreen = () => {
        this.stdout.write(Ansi.exitAltScreen);
    };
}
