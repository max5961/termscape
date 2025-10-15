import { DomElement } from "./DomElement.js";
import type { TTagNames } from "../Types.js";
import type { BoxStyle, ShadowBoxStyle } from "../style/Style.js";
import type { BaseProps } from "../Props.js";

export class BoxElement extends DomElement<BoxStyle, ShadowBoxStyle> {
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

    protected override get defaultProps(): BaseProps {
        return {};
    }
}
