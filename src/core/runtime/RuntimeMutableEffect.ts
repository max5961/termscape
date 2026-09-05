import type { _Pick } from "../../util.js";
import { Ansi } from "../Ansi.js";
import type { CoreRootElement } from "../CoreRootElement.js";
import { StateChange } from "../renderer/RenderStateChange.js";
import type { RuntimeControl } from "./Runtime.js";
import { RuntimeEffect, type RuntimeOperations } from "./RuntimeEffect.js";

type Effect = _Pick<RuntimeControl, "altScreen">;

export class RuntimeMutableEffect extends RuntimeEffect<Effect> {
    private readonly root: CoreRootElement;
    protected override readonly setupState: Effect;

    constructor(root: CoreRootElement, setup: Partial<RuntimeControl>) {
        super();
        this.root = root;
        this.setupState = {
            altScreen: setup.altScreen ?? false,
        };
    }

    protected override operations: RuntimeOperations<Effect> = {
        altScreen: {
            set: (v) => {
                return v ? this.enterAltScreen() : this.exitAltScreen();
            },
            disable: (v) => {
                if (v) {
                    return this.exitAltScreen();
                }
            },
            initialize: (v) => {
                if (v) {
                    this.enterAltScreen();
                }
            },
        },
    };

    private enterAltScreen = () => {
        this.root.runtime.stdout.write(Ansi.enterAltScreen);
        this.root.runtime.stdout.write(Ansi.cursor.position(0, 0));
        this.root.scheduleRender(StateChange.Screen);
    };

    private exitAltScreen = () => {
        this.root.runtime.stdout.write(Ansi.exitAltScreen);
    };
}
