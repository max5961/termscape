import type { IStyle } from "../core/style/IStyle.js";
import type { ITreeNode } from "../core/TreeNode.js";
import type { Style } from "./types.js";
import { CoreElement } from "../core/CoreElement.js";

export abstract class DomElement<T extends keyof IStyle = keyof IStyle>
    implements ITreeNode<DomElement>
{
    protected readonly _core: CoreElement;

    constructor(defaultStyle: IStyle) {
        this._core = new CoreElement(defaultStyle, this);
    }

    public get style(): Style<T> {
        return this._core.virtual;
    }

    public set style(style: Style<T>) {
        this._core.virtual.__setStyle(style);
    }

    public appendChild(child: DomElement): void {
        return this._core.treeNode.appendChild(child._core);
    }

    public removeChild(child: DomElement): void {
        return this._core.treeNode.removeChild(child._core);
    }

    public insertBefore(child: DomElement, beforeChild: DomElement): void {
        return this._core.treeNode.insertBefore(child._core, beforeChild._core);
    }

    public replaceChildren(
        children: (DomElement | null | undefined)[],
        freeRecursive?: boolean,
    ): void {
        return this._core.treeNode.replaceChildren(
            children.map((c) => c?._core),
            freeRecursive,
        );
    }

    public get parentElement(): DomElement | undefined {
        return this._core.treeNode.parentElement?.shell;
    }

    public get firstElementChild(): DomElement | undefined {
        return this._core.treeNode.firstElementChild?.shell;
    }

    public get lastElementChild(): DomElement | undefined {
        return this._core.treeNode.lastElementChild?.shell;
    }
}
