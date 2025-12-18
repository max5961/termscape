import { DomElement } from "./DomElement.js";
import type { TTagNames } from "../Types.js";
import type { BoxStyle } from "../style/Style.js";
import type { Props } from "../Props.js";

export class BoxElement extends DomElement<{
    Style: BoxStyle;
    Props: Props.Box;
}> {
    public tagName: TTagNames;

    constructor() {
        super();
        this.tagName = "BOX_ELEMENT";
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
