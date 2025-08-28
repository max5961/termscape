type Status = { focus: boolean; shallowFocus: boolean };

/* eslint-disable @typescript-eslint/no-this-alias */

export class Focus {
    public children: Set<Focus>;
    public nearestCheckpoint: CheckPoint | null;
    private dispatched: CheckPoint | null;

    constructor() {
        this.children = new Set();
        this.nearestCheckpoint = null;
        this.dispatched = null;
    }

    public appendChild(focus: Focus) {
        focus.nearestCheckpoint = this.nearestCheckpoint;
        this.children.add(focus);
    }

    public removeChild(focus: Focus) {
        this.children.delete(focus);
    }

    public dispatchCheckpoint(focused: boolean) {
        if (this.dispatched) return;

        const checkpoint = new CheckPoint(focused);

        const nearest = this.nearestCheckpoint;
        if (nearest) {
            nearest.children.add(checkpoint);
            checkpoint.parent = nearest;
        }

        this.dispatched = checkpoint;
        this.updateDescendentNearest(checkpoint);
    }

    public removeDispatchedCheckpoint() {
        if (!this.dispatched) return;

        if (this.dispatched.parent) {
            this.dispatched.parent.children = this.dispatched.children;
        }

        this.dispatched = null;
        this.updateDescendentNearest(this.nearestCheckpoint);
    }

    public getStatus(): Status {
        return (
            this.nearestCheckpoint?.getStatus() ?? { focus: true, shallowFocus: false }
        );
    }

    private updateDescendentNearest(nearest: CheckPoint | null) {
        const update = (focus: Focus, nearest: CheckPoint | null) => {
            if (focus.dispatched) return;
            focus.children.forEach((child) => {
                update(child, nearest);
            });
        };

        this.children.forEach((child) => update(child, nearest));
    }
}

export class CheckPoint {
    public parent: CheckPoint | null;
    public children: Set<CheckPoint>;
    public focused: boolean;

    constructor(focused: boolean) {
        this.focused = focused;
        this.parent = null;
        this.children = new Set();
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
