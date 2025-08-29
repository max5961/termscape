import { DomElement } from "./DomElement.js";
import type { TTagNames } from "../Types.js";
import type { VirtualBoxStyle, ShadowBoxStyle, VirtualStyle } from "../style/Style.js";

export class BoxElement extends DomElement<VirtualBoxStyle, ShadowBoxStyle> {
    public tagName: TTagNames;

    constructor() {
        super();
        this.tagName = "BOX_ELEMENT";
        this.style = this.defaultStyles;
    }

    protected override defaultStyles: VirtualStyle = {
        flexWrap: "nowrap",
        flexDirection: "row",
        flexGrow: 0,
        flexShrink: 1,
    };
}
