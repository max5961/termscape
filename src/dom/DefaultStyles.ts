import type { IStyle } from "../core/style/IStyle.js";

export class DefaultStyles {
    public static readonly DomElement: IStyle = {
        display: "flex",
        zIndex: 0,
        overflow: "visible",
        flexDirection: "row",
        flexGrow: 0,
        flexShrink: 1,
    };

    public static readonly Box: IStyle = {
        ...DefaultStyles.DomElement,
        flexWrap: "nowrap",
    };

    public static readonly Root: IStyle = {
        ...DefaultStyles.DomElement,
        ...DefaultStyles.Box,
    };

    public static readonly Text: IStyle = {
        ...DefaultStyles.DomElement,
        wrap: "wrap",
    };
}
