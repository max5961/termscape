import { ElementIdentities } from "../Constants.js";
import { BoxElement } from "./BoxElement.js";

export class LayoutNode extends BoxElement {
    protected override readonly identities = ElementIdentities.LayoutNode;

    constructor() {
        super();
    }
}
