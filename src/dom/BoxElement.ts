import { DomElement } from "./DomElement.js";
import type { BoxStyle } from "../style/Style.js";
import type { Props } from "../Props.js";
import { TagNameEnum } from "../Constants.js";
import { BOX_ELEMENT } from "../Symbols.js";

export abstract class AbstractBoxElement extends DomElement<{
    Style: BoxStyle;
    Props: Props.Box;
}> {
    protected static override identity = BOX_ELEMENT;

    constructor() {
        super();
        this.style = this.defaultStyles;
    }

    protected override get defaultStyles(): BoxStyle {
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
