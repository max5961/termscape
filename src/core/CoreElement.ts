import { Yg } from "../Constants.js";
import type { YogaNode } from "../Types.js";
import type { DomElement } from "../dom/DomElement.js";
import { RootEmulator } from "./RootEmulator.js";
import { TreeNode } from "./TreeNode.js";
import type { IStyle } from "./style/IStyle.js";
import { ShadowStyle } from "./style/ShadowStyle.js";
import { VirtualStyle } from "./style/VirtualStyle.js";

export class CoreElement {
    /** keep shell optional for testing and because the kernel should not need to know about the shell */
    public readonly shell?: DomElement;
    public readonly root: RootEmulator;
    public readonly yogaNode: YogaNode;
    public readonly treeNode: TreeNode;
    public readonly shadow: ShadowStyle;
    public readonly virtual: VirtualStyle;

    constructor(defaults: IStyle, shell?: DomElement) {
        this.shell = shell;
        this.root = new RootEmulator();
        this.yogaNode = Yg.Node.create();
        this.treeNode = new TreeNode(this);
        this.shadow = new ShadowStyle(this);
        this.virtual = new VirtualStyle(defaults, this.shadow);
    }
}
