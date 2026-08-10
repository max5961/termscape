import { FocusService } from "./FocusService.js";
import { FocusNodeController } from "./FocusNodeController.js";
import { DomElement } from "../DomElement.js";

export class FocusServiceController extends FocusService {
    public override node: FocusNodeController;

    constructor(host: DomElement) {
        super(host);
        this.node = new FocusNodeController(host);
    }

    /**
     * Has the intended side effect of setting child focus to false.  The focused
     * child must be explicitly set.
     *
     * When focusing a child, DomElement.focus() works as it will check to see if
     * there is a FocusNodeController and if there is it will unfocus the focused
     * node under the controller (if exists) before focusing the child and making
     * the child the focused node in the set of nodes controlled by the controller
     * */
    public bindChild(child: FocusService) {
        this.node.bindChild(this.getNode(child));
    }

    public unbindChild(child: FocusService) {
        this.node.unbindChild(this.getNode(child));
    }

    public override removeChild(child: FocusService): void {
        super.removeChild(child);
        this.node.unbindChild(this.getNode(child));
    }

    public get focused() {
        return this.node.focused?.host;
    }
}
