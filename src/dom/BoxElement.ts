import type { Props } from "./props/Props.js";
import type { Style } from "./style/Style.js";
import { DomElement } from "./DomElement.js";
import { ElementIdentities, TagNameIdentityMap } from "../Constants.js";
import { DefaultStyles } from "./style/DefaultStyles.js";

export class BoxElement extends DomElement<{
    Style: Style.Box;
    Props: Props.Box;
}> {
    protected override readonly identities = ElementIdentities.BoxElement;

    constructor() {
        super(DefaultStyles.Box);
    }
}
