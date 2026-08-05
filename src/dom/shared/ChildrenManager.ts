import { ErrorMessages } from "../../shared/ErrorMessages.js";
import type { YogaNode } from "../../Types.js";
import type { DomElement } from "../DomElement.js";

export class ChildrenManager {
    private host: DomElement;
    private node: YogaNode;
    private set: Set<DomElement>;
    public children: DomElement[];
    public parentElement: DomElement | null;

    constructor(host: DomElement) {
        this.host = host;
        this.node = this.host._node;
        this.set = new Set();
        this.children = [];
        this.parentElement = null;
    }

    public getChildren() {
        return [...this.children];
    }

    public getParentElement() {
        return this.parentElement;
    }

    public get firstElementChild(): DomElement | undefined {
        return this.children[0];
    }

    public get lastElementChild(): DomElement | undefined {
        return this.children[this.children.length - 1];
    }

    /**
     * Rules:
     * - appendChild supports inserting a child that is already a child.  When this
     *   happens the child is moved to the end of the children list
     * */
    public appendChild(child: DomElement): void {
        if (this.set.has(child)) {
            this.removeChildWithoutDetach(child);
        }
        this.children.push(child);
        this.node.insertChild(child._node, this.children.length - 1);
        this.set.add(child);
        child._childrenManager.parentElement = this.host;
    }

    /**
     * Rules:
     * - if the beforeChild is not a member of the children list, then throw an error
     * - if the beforeChild argument is not provided, throw an error
     * - supports inserting a child that is already a child
     * */
    public insertBefore(child: DomElement, beforeChild: DomElement) {
        if (!this.set.has(beforeChild)) {
            if (beforeChild === undefined) {
                this.host._throwError(ErrorMessages.insertBeforeArgs);
            } else {
                this.host._throwError(ErrorMessages.insertBefore);
            }
        }

        if (this.set.has(child)) {
            this.removeChildWithoutDetach(child);
        }

        const beforeChildIdx = this.children.indexOf(beforeChild);
        this.children.splice(beforeChildIdx, 0, child);
        this.node.insertChild(child._node, beforeChildIdx);
        this.set.add(child);
        child._childrenManager.parentElement = this.host;
    }

    public removeChild(child: DomElement, freeRecursive = false) {
        if (!this.set.has(child)) {
            this.host._throwError(ErrorMessages.removeChild);
        }

        const idx = this.children.indexOf(child);
        this.children.splice(idx, 1);
        this.node.removeChild(child._node);
        this.set.delete(child);
        child._childrenManager.parentElement = null;

        if (freeRecursive) {
            child._node.freeRecursive();
        }
    }

    public removeChildWithoutDetach(child: DomElement) {
        const idx = this.children.indexOf(child);
        this.children.splice(idx, 1);
        this.node.removeChild(child._node);
    }
}

// private addChildToTree(child: DomElement): void {
//     this._childSet.add(child);
//     this._focusNode.addChild(child._focusNode);
//     child.parentElement = this;
// }
//
// private removeChildFromTree(child: DomElement): void {
//     this._childSet.delete(child);
//     this._focusNode.removeChild(child._focusNode);
//     child.parentElement = null;
// }
//
// private insertChildAtEnd(child: DomElement): void {
//     this._node.insertChild(child._node, this._children.length);
//     this._children.push(child);
// }
//
// private insertChildAt(child: DomElement, idx: number) {
//     this._node.insertChild(child._node, idx);
//     this._children.splice(idx, 0, child);
// }
//
// private insertChildBefore(child: DomElement, beforeChild: DomElement) {
//     if (!this._childSet.has(beforeChild)) {
//         this._throwError(ErrorMessages.insertBefore);
//     }
//
//     const idx = this._children.indexOf(beforeChild);
//     this.insertChildAt(child, idx);
// }
//
// @Render({ layoutChange: true })
// private _appendChild(child: DomElement): void {
//     if (this._childSet.has(child)) return;
//
//     this.addChildToTree(child);
//     this.insertChildAtEnd(child);
//     child.afterAttached(this.getRoot());
// }
// public appendChild(child: DomElement): void {
//     this._appendChild(child);
// }
//
// @Render({ layoutChange: true })
// private _insertBefore(child: DomElement, beforeChild?: DomElement | null): void {
//     // insertBefore supports inserting a child that is already a child
//     if (this._childSet.has(child)) {
//         this.removeChild(child);
//     }
//
//     if (!beforeChild) {
//         return this.appendChild(child);
//     }
//
//     this.addChildToTree(child);
//     this.insertChildBefore(child, beforeChild);
//     child.afterAttached(this.getRoot());
// }
// public insertBefore(child: DomElement, beforeChild?: DomElement | null): void {
//     this._insertBefore(child, beforeChild);
// }
//
// @Render({ layoutChange: true })
// private _removeChild(child: DomElement, freeRecursive?: boolean) {
//     const idx = this._children.indexOf(child);
//
//     if (idx === -1 || !this._childSet.has(child)) {
//         this._throwError(ErrorMessages.removeChild);
//     }
//     child.beforeDetaching(this.getRoot());
//     this.removeChildFromTree(child);
//     this._children.splice(idx, 1);
//     this._node.removeChild(child._node);
//
//     if (freeRecursive) {
//         child._node.freeRecursive();
//     }
// }
// public removeChild(child: DomElement, freeRecursive?: boolean) {
//     this._removeChild(child, freeRecursive);
// }
//
// @Render({ layoutChange: true })
// private _removeParent() {
//     this.parentElement?.removeChild(this);
// }
// public removeParent() {
//     this._removeParent();
// }
//
// @Render({ layoutChange: true })
// private _replaceChildren(...children: DomElement[]) {
//     const root = this.getRoot();
//     this._children.forEach((child) => {
//         this.removeChildFromTree(child);
//         child.beforeDetaching(root);
//         this._node.removeChild(child._node);
//         child._node.freeRecursive();
//     });
//
//     this._children = [];
//     children.forEach((child) => {
//         this.appendChild(child);
//     });
// }
// public replaceChildren(...children: DomElement[]) {
//     this._replaceChildren(...children);
// }
