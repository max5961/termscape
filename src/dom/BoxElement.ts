import { DomElement } from "./DomElement.js";
import { TagNameEnum, BOX_ELEMENT } from "../Constants.js";
import type { Props } from "./props/Props.js";
import type { Style } from "./style/Style.js";
import { DefaultStyles } from "./style/DefaultStyles.js";

export abstract class AbstractBoxElement extends DomElement<{
    Style: Style.Box;
    Props: Props.Box;
}> {
    protected static override identity = BOX_ELEMENT;

    constructor() {
        super(DefaultStyles.Box);
    }

    protected override get defaultProps(): Props.Box {
        return {};
    }
}

export class BoxElement extends AbstractBoxElement {
    protected static override identity = BOX_ELEMENT;

    constructor() {
        super();
    }

    override get tagName(): typeof TagNameEnum.Box {
        return "box";
    }
}
