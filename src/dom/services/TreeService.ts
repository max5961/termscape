import { ErrorMessages } from "../../shared/ErrorMessages.js";
import type { YogaNode } from "../../Types.js";
import type { DomElement } from "../DomElement.js";

export interface ITreeService {
    appendChild(child: DomElement): void;
    insertBefore(child: DomElement, beforeChild: DomElement): void;
    removeChild(child: DomElement, freeRecursive?: boolean): void;
    get children(): DomElement[];
    get parentElement(): DomElement | undefined;
    get firstElementChild(): DomElement | undefined;
    get lastElementChild(): DomElement | undefined;
}

export class TreeService implements ITreeService {
    private _host: DomElement;
    private _node: YogaNode;
    private _set: Set<DomElement>;
    private _children: DomElement[];
    public get children() {
        return this._children;
    }
    private _parentElement: DomElement | undefined;
    public get parentElement() {
        return this._parentElement;
    }

    constructor(host: DomElement) {
        this._host = host;
        this._node = this._host._node;
        this._set = new Set();
        this._children = [];
    }

    public getChildren() {
        return [...this._children];
    }

    public getParentElement() {
        return this._parentElement;
    }

    public get firstElementChild(): DomElement | undefined {
        return this._children[0];
    }

    public get lastElementChild(): DomElement | undefined {
        return this._children[this._children.length - 1];
    }

    /**
     * Rules:
     * - appendChild supports inserting a child that is already a child.  When this
     *   happens the child is moved to the end of the children list
     * */
    public appendChild(child: DomElement): void {
        if (this._set.has(child)) {
            this.removeChildWithoutDetach(child);
        }
        this._children.push(child);
        this._node.insertChild(child._node, this._children.length - 1);
        this._set.add(child);
        this._host._focusService.addFocusNodeChild(child._focusService);
        child._treeService._parentElement = this._host;
    }

    /**
     * Rules:
     * - if the beforeChild is not a member of the children list, then throw an error
     * - if the beforeChild argument is not provided, throw an error
     * - supports inserting a child that is already a child
     * */
    public insertBefore(child: DomElement, beforeChild: DomElement) {
        if (!this._set.has(beforeChild)) {
            if (beforeChild === undefined) {
                this._host._throwError(ErrorMessages.insertBeforeArgs);
            } else {
                this._host._throwError(ErrorMessages.insertBefore);
            }
        }

        if (this._set.has(child)) {
            this.removeChildWithoutDetach(child);
        }

        const beforeChildIdx = this._children.indexOf(beforeChild);
        this._children.splice(beforeChildIdx, 0, child);
        this._node.insertChild(child._node, beforeChildIdx);
        this._set.add(child);
        this._host._focusService.addFocusNodeChild(child._focusService);
        child._treeService._parentElement = this._host;
    }

    public removeChild(child: DomElement, freeRecursive = false) {
        if (!this._set.has(child)) {
            this._host._throwError(ErrorMessages.removeChild);
        }

        const idx = this._children.indexOf(child);
        this._children.splice(idx, 1);
        this._node.removeChild(child._node);
        this._set.delete(child);
        this._host._focusService.removeFocusNodeChild(child._focusService);
        child._treeService._parentElement = undefined;

        if (freeRecursive) {
            child._node.freeRecursive();
        }
    }

    private removeChildWithoutDetach(child: DomElement) {
        const idx = this._children.indexOf(child);
        this._children.splice(idx, 1);
        this._node.removeChild(child._node);
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
