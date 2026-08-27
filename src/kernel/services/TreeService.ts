import type { YogaNode } from "../../Types.js";
import type { Kernel } from "../Kernel.js";
import { RootKernel } from "../RootKernel.js";

export interface ITreeService<T> {
    appendChild(child: T): void;
    insertBefore(child: T, beforeChild: T): void;
    removeChild(child: T, freeRecursive?: boolean): void;
    replaceChildren(children: (T | undefined | null)[], freeRecursive?: boolean): void;
    get parentElement(): T | undefined;
    get firstElementChild(): T | undefined;
    get lastElementChild(): T | undefined;
}

export class TreeService implements ITreeService<Kernel> {
    private readonly _kernel: Kernel;
    private readonly _yogaNode: YogaNode;
    private readonly _set: Set<Kernel>;
    private readonly _children: Kernel[];
    private _parentElement: Kernel | undefined;

    constructor(kernel: Kernel) {
        this._kernel = kernel;
        this._yogaNode = kernel.yogaNode;
        this._set = new Set();
        this._children = [];
    }

    public get parentElement(): Kernel | undefined {
        return this._parentElement;
    }

    public get firstElementChild(): Kernel | undefined {
        return this._children[0];
    }

    public get lastElementChild(): Kernel | undefined {
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
    public appendChild(child: Kernel): void {
        let wasAttached = false;
        if (this._set.has(child)) {
            this.transientRemoveChild(child);
            wasAttached = true;
        }

        this._set.add(child);
        this._children.push(child);
        this._yogaNode.insertChild(child.yogaNode, this._children.length - 1);
        child.treeService._parentElement = this._kernel;

        if (wasAttached) return;
        const root = this._kernel.root.getKernel();
        this.handleChildRootAttach(child, root);
    }

    /**
     * Rules:
     * - if the beforeChild is not a member of the children list, then throw an error
     * - if the beforeChild argument is not provided, throw an error
     * - supports inserting a child that is already a child
     * */
    public insertBefore(child: Kernel, beforeChild: Kernel): void {
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
        child.treeService._parentElement = this._kernel;

        if (wasAttached) return;
        const root = this._kernel.root.getKernel();
        this.handleChildRootAttach(child, root);
    }

    public removeChild(child: Kernel, freeRecursive?: boolean): void {
        if (!this._set.has(child)) {
            // throw error
            return;
        }

        const idx = this._children.indexOf(child);
        this._children.splice(idx, 1);
        this._yogaNode.removeChild(child.yogaNode);
        this._set.delete(child);
        child.treeService._parentElement = undefined;

        const root = this._kernel.root.getKernel();
        this.handleChildRootDetach(child, root);

        if (freeRecursive) {
            child.yogaNode.freeRecursive();
        }
    }

    public replaceChildren(
        children: (Kernel | null | undefined)[],
        freeRecursive?: boolean,
    ): void {
        const prev = [...this._children];
        prev.forEach((c) => {
            this.removeChild(c, freeRecursive);
        });

        for (let i = 0; i < children.length; ++i) {
            if (children[i]) {
                this.appendChild(children[i] as Kernel);
            }
        }
    }

    private transientRemoveChild(child: Kernel) {
        const idx = this._children.indexOf(child);
        this._children.splice(idx, 1);
        this._yogaNode.removeChild(child.yogaNode);
    }

    private dfs(kernel: Kernel, cb: (kernel: Kernel) => void) {
        cb(kernel);
        kernel.treeService._children.forEach((child) => {
            this.dfs(child, cb);
        });
    }

    private handleChildRootAttach(child: Kernel, root: RootKernel | undefined) {
        if (root) {
            this.dfs(child, (child) => {
                child.root.onAttach(root);
            });
        }
    }

    private handleChildRootDetach(child: Kernel, root: RootKernel | undefined) {
        if (root) {
            this.dfs(child, (child) => {
                child.root.onDetach(root);
            });
        }
    }
}
