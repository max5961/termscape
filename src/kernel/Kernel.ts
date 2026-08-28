import { Yg } from "../Constants.js";
import type { YogaNode } from "../Types.js";
import type { Style } from "./style/Style.js";
import { RootEmulator } from "./RootEmulator.js";
import { TreeNode, type ITreeNode } from "./tree/TreeNode.js";
import { ShadowStyle } from "./style/ShadowStyle.js";
import { VirtualStyle } from "./style/VirtualStyle.js";

export class Kernel {
    /** keep shell optional for testing and because the kernel should not need to know about the shell */
    public readonly shell?: DomElement;
    public readonly root: RootEmulator;
    public readonly yogaNode: YogaNode;
    public readonly treeNode: TreeNode;
    public readonly shadow: ShadowStyle;
    public readonly virtual: VirtualStyle;

    constructor(shell?: DomElement) {
        this.shell = shell;
        this.root = new RootEmulator();
        this.yogaNode = Yg.Node.create();
        this.treeNode = new TreeNode(this);
        this.shadow = new ShadowStyle(this);
        this.virtual = new VirtualStyle({}, this.shadow);
    }
}

export abstract class DomElement<S extends Style.All = Style.All>
    implements ITreeNode<DomElement>
{
    protected readonly _kernel: Kernel;

    constructor() {
        this._kernel = new Kernel(this);
    }

    public get style() {
        return this._kernel.virtual as unknown as S;
    }

    public set style(style: S) {
        this._kernel.virtual.__setStyle(style);
    }

    public appendChild(child: DomElement): void {
        return this._kernel.treeNode.appendChild(child._kernel);
    }

    public removeChild(child: DomElement): void {
        return this._kernel.treeNode.removeChild(child._kernel);
    }

    public insertBefore(child: DomElement, beforeChild: DomElement): void {
        return this._kernel.treeNode.insertBefore(child._kernel, beforeChild._kernel);
    }

    public replaceChildren(
        children: (DomElement | null | undefined)[],
        freeRecursive?: boolean,
    ): void {
        return this._kernel.treeNode.replaceChildren(
            children.map((c) => c?._kernel),
            freeRecursive,
        );
    }

    public get parentElement(): DomElement | undefined {
        return this._kernel.treeNode.parentElement?.shell;
    }

    public get firstElementChild(): DomElement | undefined {
        return this._kernel.treeNode.firstElementChild?.shell;
    }

    public get lastElementChild(): DomElement | undefined {
        return this._kernel.treeNode.lastElementChild?.shell;
    }
}

export class BoxElement extends DomElement<Style.Box> {
    constructor() {
        super();
    }
}
