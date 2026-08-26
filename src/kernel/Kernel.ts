import { Yg } from "../Constants.js";
import type { YogaNode } from "../Types.js";
import { RootEmulator } from "./RootEmulator.js";
import { TreeService } from "./services/TreeService.js";

export class Kernel {
    public readonly yogaNode: YogaNode;
    public readonly treeService: TreeService;
    public readonly root: RootEmulator;

    constructor() {
        this.root = new RootEmulator();
        this.yogaNode = Yg.Node.create();
        this.treeService = new TreeService(this);
    }
}
