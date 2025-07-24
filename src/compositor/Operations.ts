export class Operations {
    private layers: Record<number, (() => unknown)[]>;

    constructor() {
        this.layers = {};
    }

    public defer(layer: number, cb: () => unknown): void {
        this.layers[layer] = this.layers[layer] ?? [];
        this.layers[layer].push(cb);
    }

    public performAll() {
        const layers = Object.keys(this.layers)
            .sort((a, b) => Number(a) - Number(b))
            .map((s) => Number(s));

        for (const layer of layers) {
            this.layers[layer]?.forEach((operation) => operation());
        }
    }
}
