import type { Style } from "../Style.js";

export class DefaultStyles {
    public static readonly DomElement: Style.All = {
        display: "flex",
        zIndex: 0,
        overflow: "visible",
        flexDirection: "row",
        flexGrow: 0,
        flexShrink: 1,
    };

    public static readonly Box: Style.All = {
        ...DefaultStyles.DomElement,
        flexWrap: "nowrap",
    };

    public static readonly Root: Style.All = {
        ...DefaultStyles.DomElement,
        ...DefaultStyles.Box,
    };

    public static readonly Text: Style.All = {
        ...DefaultStyles.DomElement,
        wrap: "wrap",
    };

    public static readonly Book: Style.All = {
        ...DefaultStyles.DomElement,
    };

    public static readonly Canvas: Style.All = {
        ...DefaultStyles.DomElement,
    };

    public static readonly Layout: Style.All = {
        ...DefaultStyles.DomElement,
        flexDirection: "column",
        flexWrap: "nowrap",
        overflow: "scroll",
        height: "100",
        width: "100",
    };

    public static readonly List: Style.All = {
        ...DefaultStyles.DomElement,
        flexDirection: "column",
        flexWrap: "nowrap",
        overflow: "scroll",
        height: "100",
        width: "100",
    };

    public static readonly Input: Style.All = {
        ...DefaultStyles.DomElement,
        width: "100",
        height: 1,
        overflow: "scroll",
    };

    public static readonly VirtualList: Style.All = {
        ...DefaultStyles.DomElement,
        flexWrap: "nowrap",
        flexDirection: "column",
        overflow: "scroll",
    };
}
