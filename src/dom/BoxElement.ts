import { DomElement } from "./DomElement.js";
import { TagNameEnum, BOX_ELEMENT } from "../Constants.js";
import type { Props } from "./props/Props.js";
import type { Style } from "./style/Style.js";

export abstract class AbstractBoxElement extends DomElement<{
    Style: Style.Box;
    Props: Props.Box;
}> {
    protected static override identity = BOX_ELEMENT;

    constructor() {
        super();
        this.style = this.defaultStyles;
    }

    protected override get defaultStyles(): Style.Box {
        return {
            flexWrap: "nowrap",
            flexDirection: "row",
            flexGrow: 0,
            flexShrink: 1,
        };
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
