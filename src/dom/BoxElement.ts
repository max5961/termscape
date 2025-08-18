import { DomElement } from "./DomElement.js";
import type { TTagNames, VBoxStyle, ShadowBoxStyle } from "../Types.js";

export class BoxElement extends DomElement<VBoxStyle, ShadowBoxStyle> {
    public tagName: TTagNames;

    constructor() {
        super();
        this.tagName = "BOX_ELEMENT";
        this.style = this.defaultStyles;
    }

    protected override defaultStyles: VBoxStyle = {
        flexWrap: "nowrap",
        flexDirection: "row",
        flexGrow: 0,
        flexShrink: 1,
    };
}
