import type { Canvas } from "../canvas/Canvas.js";
import type { CoreElement } from "../CoreElement.js";
import { DrawBox } from "./DrawBox.js";

export class Draw {
    private layers: Map<number, (() => unknown)[]>;
    private ops: (() => unknown)[] | undefined;
    private lowestLayer: number;
    private box: DrawBox;

    constructor() {
        this.layers = new Map();
        this.lowestLayer = 0;
        this.box = new DrawBox(this);
    }

    public reset() {
        this.layers = new Map();
        this.ops = undefined;
    }

    private getDrawOps() {
        if (this.ops) return this.ops;

        this.ops = [...this.layers.keys()]
            .sort((a, b) => a - b)
            .flatMap((layer) => {
                return this.layers.get(layer)!;
            });

        return this.ops;
    }

    public performDrawOps() {
        const ops = this.getDrawOps();
        ops.forEach((op) => op());
    }

    public getLowestLayer() {
        return this.lowestLayer;
    }

    public enqueue(zIndex: number, core: CoreElement, canvas: Canvas) {
        this.lowestLayer = Math.min(this.lowestLayer, zIndex);

        if (!this.layers.get(zIndex)) {
            return this.layers.set(zIndex, [() => this.compose(core, canvas)]);
        }
        this.layers.get(zIndex)!.push(() => this.compose(core, canvas));
    }

    private compose(core: CoreElement, canvas: Canvas) {
        this.box.compose(core, canvas);
    }
}
