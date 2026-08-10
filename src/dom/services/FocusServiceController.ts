import { FocusNodeController } from "./FocusNode.js";
import { FocusService } from "./FocusService.js";

export class FocusServiceController extends FocusService {
    public override node: FocusNodeController;

    constructor() {
        super();
        this.node = new FocusNodeController();
    }

    public bindChild(child: FocusService) {
        this.node.bindChild(child.node);
    }

    public unbindChild(child: FocusService) {
        this.node.unbindChild(child.node);
    }

    public override removeChild(child: FocusService): void {
        super.removeChild(child);
        this.node.unbindChild(child.node);
    }
}
