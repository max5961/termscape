import { Yg } from "../Constants.js";
import type { YogaNode } from "../Types.js";
import type { DomElement } from "../dom/DomElement.js";
import { RootEmulator } from "./RootEmulator.js";
import { TreeNode } from "./TreeNode.js";
import type { Canvas } from "./canvas/Canvas.js";
import type { IStyle } from "./style/IStyle.js";
import { ShadowStyle } from "./style/ShadowStyle.js";
import { VirtualStyle } from "./style/VirtualStyle.js";

export class CoreElement {
    public readonly shell: DomElement;
    public readonly root: RootEmulator;
    public readonly yogaNode: YogaNode;
    public readonly treeNode: TreeNode;
    public readonly shadow: ShadowStyle;
    public readonly virtual: VirtualStyle;
    public canvas: Canvas | undefined;

    constructor(shell: DomElement, defaults: IStyle) {
        this.shell = shell;
        this.yogaNode = Yg.Node.create();
        this.root = new RootEmulator();
        this.treeNode = new TreeNode(this);
        this.shadow = new ShadowStyle(this);
        this.virtual = new VirtualStyle(defaults, this.shadow);
    }
}
