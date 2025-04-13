type NodeMap<T extends string = string> = T[][];
type Opts = {
    startIdx?: number;
    startNode?: string;
};
type Data = { name: string; index: number };

export class Navigator {
    private opts: Opts;
    private nodemap!: NodeMap;
    private head!: null | Node;
    private createdNames!: Map<string, Node>;
    private createdIndexes!: Map<number, Node>;

    constructor(nodemap: NodeMap, opts: Opts = {}) {
        this.opts = opts;
        this.generate(nodemap);
    }

    private generate = (nodemap: NodeMap): void => {
        // Make sure that if nodemap is updated, everything is reset
        this.nodemap = nodemap;
        this.head = null;
        this.createdNames = new Map<string, Node>();
        this.createdIndexes = new Map<number, Node>();

        const nodes = this.nodemap.map((row) => {
            return row.map((_cell) => null);
        }) as (Node | null)[][];

        for (let i = 0; i < this.nodemap.length; ++i) {
            for (let j = 0; j < this.nodemap[i].length; ++j) {
                const name = this.nodemap[i][j];
                const coord = { x: j, y: i };
                if (!name) continue;

                const node = !this.createdNames.has(name)
                    ? new Node({ idx: this.createdNames.size, name: name, coords: [] })
                    : this.createdNames.get(name);

                if (node) {
                    this.createdNames.set(name, node);
                    this.createdIndexes.set(this.createdNames.size - 1, node);
                    node.coords.push(coord);
                    nodes[i][j] = node;

                    if (
                        this.createdNames.size === 1 ||
                        this.opts.startIdx === this.createdNames.size - 1 ||
                        this.opts.startNode === node.name
                    ) {
                        this.head = node;
                    }
                }
            }
        }

        for (let i = 0; i < this.nodemap.length; ++i) {
            for (let j = 0; j < this.nodemap[i].length; ++j) {
                const name = this.nodemap[i][j];
                const node = nodes[i][j];
                if (!name || !node) continue;

                const up = nodes[i - 1]?.[j];
                const down = nodes[i + 1]?.[j];
                const left = nodes[i][j - 1];
                const right = nodes[i][j + 1];

                if (up) node.up.set(up.name, up);
                if (down) node.up.set(down.name, down);
                if (left) node.up.set(left.name, left);
                if (right) node.up.set(right.name, right);
            }
        }
    };

    private getFocusIdx = (): number => {
        return this.head?.idx ?? -1;
    };

    private getFocusName = (): string => {
        return this.head?.name ?? "";
    };

    private getData = (): Data => {
        return { name: this.getFocusName(), index: this.getFocusIdx() };
    };

    private move = (d: "up" | "down" | "left" | "right", update?: () => void): string => {
        const prev = this.head;
        const backref = this.head?.backRef;
        const map = this.head?.[d] ?? new Map<string, Node>();

        // Need to find either the backref or just an arbitrary node, which will be
        // the first insertion
        if (map.size) {
            for (const [name, node] of map.entries()) {
                if (backref) {
                    if (backref.name === name) {
                        this.head = node;
                        break;
                    }
                } else {
                    this.head = node;
                    break;
                }
            }

            if (prev) {
                prev.backRef = null;
            }

            if (this.head) {
                this.head.backRef = prev;
            }

            update?.();
        }

        return this.getFocusName();
    };

    public getControl = (cb: (data: Data) => unknown) => {
        const update = () => cb(this.getData());

        return {
            up: (): string => {
                return this.move("up", update);
            },
            down: (): string => {
                return this.move("down", update);
            },
            left: (): string => {
                return this.move("left", update);
            },
            right: (): string => {
                return this.move("right", update);
            },
            goToNode: <T extends string | number>(
                node: T,
            ): T extends string ? string : number => {
                const prev = this.head;
                if (typeof node === "string") {
                    this.head = this.createdNames.get(node) ?? prev;
                    update();
                    // Conditional cast so that the return type isn't a string or number literal
                    return this.getFocusName() as T extends string ? string : number;
                } else {
                    this.head = this.createdIndexes.get(node) ?? prev;
                    update();
                    return this.getFocusIdx() as T extends string ? string : number;
                }
            },
            next: (): string => {
                const idx = this.getFocusIdx();
                if (idx < 0 || idx + 1 >= this.createdIndexes.size) {
                    return this.getFocusName();
                }

                const next = this.createdIndexes.get(idx + 1);
                if (next) {
                    this.head = next;
                }

                return this.getFocusName();
            },
            prev: (): string => {
                const idx = this.getFocusIdx();
                if (idx - 1 < 0) {
                    return this.getFocusName();
                }

                const next = this.createdIndexes.get(idx - 1);
                if (next) {
                    this.head = next;
                }

                return this.getFocusName();
            },
            getNode: (): string => {
                const data = this.getData();
                return data.name;
            },
            getIndex: (): number => {
                const data = this.getData();
                return data.index;
            },
        };
    };
}

class Node {
    public idx: number;
    public name: string;
    public coords: { x: number; y: number }[];
    public up: Map<string, Node>;
    public down: Map<string, Node>;
    public left: Map<string, Node>;
    public right: Map<string, Node>;
    public backRef: Node | null;

    constructor({
        idx,
        name,
        coords,
    }: {
        idx: number;
        name: string;
        coords: { x: number; y: number }[];
    }) {
        this.idx = idx;
        this.name = name;
        this.coords = coords;
        this.up = new Map();
        this.down = new Map();
        this.left = new Map();
        this.right = new Map();
        this.backRef = null;
    }
}
