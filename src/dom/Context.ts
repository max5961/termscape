type Status = { focus: boolean; shallowFocus: boolean };

export class Focus {
    public children: Set<Focus>;
    public nearestCheckpoint: CheckPoint | null;
    private checkpoint: CheckPoint | null;
    protected parent: Focus | null;

    constructor() {
        this.children = new Set();
        this.nearestCheckpoint = null;
        this.checkpoint = null;
        this.parent = null;
    }

    public appendChild(focus: Focus) {
        focus.parent = this;
        focus.nearestCheckpoint = this.nearestCheckpoint;
        this.children.add(focus);
    }

    public removeChild(focus: Focus) {
        this.children.delete(focus);
        focus.parent = null;
        this.nearestCheckpoint = null;
        this.rewireChildren(this.checkpoint);
    }

    public becomeCheckpoint(focused: boolean) {
        if (this.checkpoint) return;

        const checkpoint = new CheckPoint(focused);

        const nearest = this.nearestCheckpoint;
        if (nearest) {
            checkpoint.parent = nearest;
        }

        this.checkpoint = checkpoint;
        this.nearestCheckpoint = checkpoint;
        this.rewireChildren(checkpoint);
    }

    public becomeNormal(freeRecursive?: boolean) {
        if (!this.checkpoint) return;

        this.checkpoint = null;
        this.nearestCheckpoint = this.parent?.nearestCheckpoint ?? null;
        if (!freeRecursive) {
            this.rewireChildren(this.nearestCheckpoint);
        }
    }

    public updateCheckpoint(focused: boolean) {
        if (!this.checkpoint) return;
        this.checkpoint.focused = focused;
    }

    public getStatus(): Status {
        return (
            this.nearestCheckpoint?.getStatus() ?? { focus: true, shallowFocus: false }
        );
    }

    private rewireChildren(nearest: CheckPoint | null) {
        this.children.forEach((child) => this.rewireHelper(child, nearest));
    }

    private rewireHelper = (focus: Focus, nearest: CheckPoint | null) => {
        if (focus.checkpoint) return;
        focus.nearestCheckpoint = nearest;
        focus.children.forEach((child) => this.rewireHelper(child, nearest));
    };
}

export class CheckPoint {
    public parent: CheckPoint | null;
    public focused: boolean;

    constructor(focused: boolean) {
        this.focused = focused;
        this.parent = null;
    }

    public getStatus(): Status {
        if (!this.focused) {
            return { focus: false, shallowFocus: false };
        }

        const result: Status = { focus: true, shallowFocus: false };
        let parent: CheckPoint | null = this.parent;

        while (parent) {
            if (!parent.focused) {
                return { focus: false, shallowFocus: true };
            }
            parent = parent.parent;
        }

        return result;
    }
}
