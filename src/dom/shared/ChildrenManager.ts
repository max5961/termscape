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
        this.host._focusNode.addChild(child._focusNode);
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
        this.host._focusNode.removeChild(child._focusNode);
        child._childrenManager.parentElement = null;

        if (freeRecursive) {
            child._node.freeRecursive();
        }
    }

    private removeChildWithoutDetach(child: DomElement) {
        const idx = this.children.indexOf(child);
        this.children.splice(idx, 1);
        this.node.removeChild(child._node);
    }

    public replaceChildren(
        next: (DomElement | undefined | null)[],
        freeRecursive = true,
    ) {
        const children = this.getChildren();
        children.forEach((c) => {
            this.removeChild(c, freeRecursive);
        });
        next.forEach((c) => c && this.appendChild(c));
    }
}
