import type { DomElement } from "../DomElement.js";

type Status = { focus: boolean; shallowFocus: boolean };

export class FocusNode {
    /** This should be named something else, such as childNodes, to prevent naming
     * conflicts with the DomElement.children getter */
    public children: Set<FocusNode>;
    public nearestCheckpoint: CheckPoint | null;
    private checkpoint: CheckPoint | null;
    protected parent: FocusNode | null;
    private elem: DomElement;

    constructor(elem: DomElement) {
        this.elem = elem;
        this.children = new Set();
        this.nearestCheckpoint = null;
        this.checkpoint = null;
        this.parent = null;
    }

    public appendChild(focus: FocusNode) {
        focus.parent = this;
        focus.nearestCheckpoint = this.nearestCheckpoint;
        this.children.add(focus);
    }

    public removeChild(focus: FocusNode) {
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
        this.propagateChanges();
    }

    public becomeNormal(freeRecursive?: boolean) {
        if (!this.checkpoint) return;

        this.checkpoint = null;
        this.nearestCheckpoint = this.parent?.nearestCheckpoint ?? null;
        if (!freeRecursive) {
            this.propagateChanges();
        }
    }

    public updateCheckpoint(focused: boolean) {
        if (!this.checkpoint) return;
        this.checkpoint.focused = focused;
        this.propagateChanges();
    }

    public getStatus(): Status {
        return (
            this.nearestCheckpoint?.getStatus() ?? { focus: true, shallowFocus: false }
        );
    }

    private propagateChanges() {
        this.rewireChildren(this.nearestCheckpoint);
        this.reapplyStyles(this.elem);
    }

    private reapplyStyles = (elem: DomElement) => {
        const styleHandler = elem._styleHandler;

        if (styleHandler) {
            elem.style = styleHandler;
        }

        elem._children.forEach((child) => {
            this.reapplyStyles(child);
        });
    };

    private rewireChildren(nearest: CheckPoint | null) {
        this.children.forEach((child) => this.rewireHelper(child, nearest));
    }

    private rewireHelper = (focus: FocusNode, nearest: CheckPoint | null) => {
        if (focus.checkpoint) return;
        focus.nearestCheckpoint = nearest;

        const styleHandler = focus.elem._styleHandler;
        if (styleHandler) {
            focus.elem.style = styleHandler;
        }

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
