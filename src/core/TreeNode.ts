import type { YogaNode } from "../Types.js";
import type { CoreElement } from "./CoreElement.js";
import type { CoreRootElement } from "./CoreRootElement.js";

export interface ITreeNode<T> {
    appendChild(child: T): void;
    insertBefore(child: T, beforeChild: T): void;
    removeChild(child: T, freeRecursive?: boolean): void;
    replaceChildren(children: (T | undefined | null)[], freeRecursive?: boolean): void;
    get parentElement(): T | undefined;
    get firstElementChild(): T | undefined;
    get lastElementChild(): T | undefined;
}

export class TreeNode implements ITreeNode<CoreElement> {
    protected readonly _kernel: CoreElement;
    protected readonly _yogaNode: YogaNode;
    protected readonly _set: Set<CoreElement>;
    protected readonly _children: CoreElement[];
    protected _parentElement: CoreElement | undefined;

    constructor(kernel: CoreElement) {
        this._kernel = kernel;
        this._yogaNode = kernel.yogaNode;
        this._set = new Set();
        this._children = [];
    }

    public get parentElement(): CoreElement | undefined {
        return this._parentElement;
    }

    public get firstElementChild(): CoreElement | undefined {
        return this._children[0];
    }

    public get lastElementChild(): CoreElement | undefined {
        return this._children[this._children.length - 1];
    }

    public get children() {
        return this._children;
    }

    /**
     * Rules:
     * - appendChild supports inserting a child that is already a child.  When this
     *   happens the child is moved to the end of the children list
     * */
    public appendChild(child: CoreElement): void {
        let wasAttached = false;
        if (this._set.has(child)) {
            this.transientRemoveChild(child);
            wasAttached = true;
        }

        this._set.add(child);
        this._children.push(child);
        this._yogaNode.insertChild(child.yogaNode, this._children.length - 1);
        child.treeNode._parentElement = this._kernel;

        if (wasAttached) return;
        const root = this._kernel.root.getReference();
        this.handleChildRootAttach(child, root);
    }

    /**
     * Rules:
     * - if the beforeChild is not a member of the children list, then throw an error
     * - if the beforeChild argument is not provided, throw an error
     * - supports inserting a child that is already a child
     * */
    public insertBefore(child: CoreElement, beforeChild: CoreElement): void {
        if (!this._set.has(beforeChild)) {
            if (beforeChild === undefined) {
                // throw insertBefore error
            } else {
                // throw insertBefore error
            }
        }

        let wasAttached = false;
        if (this._set.has(child)) {
            this.transientRemoveChild(child);
            wasAttached = true;
        }

        const beforeChildIdx = this._children.indexOf(beforeChild);
        this._children.splice(beforeChildIdx, 0, child);
        this._yogaNode.insertChild(child.yogaNode, beforeChildIdx);
        this._set.add(child);
        child.treeNode._parentElement = this._kernel;

        if (wasAttached) return;
        const root = this._kernel.root.getReference();
        this.handleChildRootAttach(child, root);
    }

    public removeChild(child: CoreElement, freeRecursive?: boolean): void {
        if (!this._set.has(child)) {
            // throw error
            return;
        }

        const idx = this._children.indexOf(child);
        this._children.splice(idx, 1);
        this._yogaNode.removeChild(child.yogaNode);
        this._set.delete(child);
        child.treeNode._parentElement = undefined;

        const root = this._kernel.root.getReference();
        this.handleChildRootDetach(child, root);

        if (freeRecursive) {
            child.yogaNode.freeRecursive();
        }
    }

    public replaceChildren(
        children: (CoreElement | null | undefined)[],
        freeRecursive?: boolean,
    ): void {
        const prev = [...this._children];
        prev.forEach((c) => {
            this.removeChild(c, freeRecursive);
        });

        for (let i = 0; i < children.length; ++i) {
            if (children[i]) {
                this.appendChild(children[i] as CoreElement);
            }
        }
    }

    private transientRemoveChild(child: CoreElement) {
        const idx = this._children.indexOf(child);
        this._children.splice(idx, 1);
        this._yogaNode.removeChild(child.yogaNode);
    }

    private dfs(kernel: CoreElement, cb: (kernel: CoreElement) => void) {
        cb(kernel);
        kernel.treeNode._children.forEach((child) => {
            this.dfs(child, cb);
        });
    }

    private handleChildRootAttach(child: CoreElement, root: CoreRootElement | undefined) {
        if (root) {
            this.dfs(child, (child) => {
                child.root.onAttach(root);
            });
        }
    }

    private handleChildRootDetach(child: CoreElement, root: CoreRootElement | undefined) {
        if (root) {
            this.dfs(child, (child) => {
                child.root.onDetach(root);
            });
        }
    }
}
