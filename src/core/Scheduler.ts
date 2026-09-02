import type { ProcessLike } from "../Types.js";
import { StateChange } from "./renderer/RenderStateChange.js";
import type { CoreRootElement } from "./CoreRootElement.js";
import type { Renderer } from "./renderer/Renderer.js";

type RenderFn = Renderer["render"];

const enum P {
    Idle,
    BeforeNextTick,
    Busy,
}

export class Scheduler {
    private readonly root: CoreRootElement;
    private readonly process: ProcessLike;
    private readonly render: RenderFn;
    private bitmask: number;
    private phase: P;
    private pendingBitmask: number;

    constructor(root: CoreRootElement, render: RenderFn) {
        this.root = root;
        this.process = root.runtimeControl.process;
        this.render = render;
        this.bitmask = 0;
        this.phase = P.Idle;
        this.pendingBitmask = 0;
    }

    public scheduleRender(change?: StateChange) {
        if (change === undefined) change = StateChange.Style;

        if (this.phase === P.Idle) {
            return this.handleIdlePhase(change);
        }

        if (this.phase === P.BeforeNextTick) {
            this.bitmask |= change;
            return;
        }

        this.pendingBitmask |= change;
    }

    private handleIdlePhase(change?: StateChange) {
        this.phase = P.BeforeNextTick;
        if (change) this.bitmask |= change;

        this.process.nextTick(() => {
            const bitmask = this.bitmask;
            this.bitmask = 0;
            this.dispatchWaiter();
            this.render(bitmask);
        });
    }

    private dispatchWaiter() {
        this.phase = P.Busy;
        setTimeout(() => {
            this.phase = P.Idle;

            if (this.pendingBitmask) {
                this.bitmask = this.pendingBitmask;
                this.pendingBitmask = 0;
                this.handleIdlePhase();
            }
        }, this.debounceMs);
    }

    private get debounceMs() {
        return this.root.runtimeControl.debounceMs;
    }
}
