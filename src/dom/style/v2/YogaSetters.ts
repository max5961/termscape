import type { YogaNode } from "../../../Types.js";
import type { Style, Shadow } from "../Style.js";
import { Yg } from "../../../Constants.js";
import { ShadowStyleProxy } from "./ShadowStyleProxy.js";

type S<T extends keyof Style.All> = Shadow<Style.All>[T];

export class YogaSetters {
    public static display(next: S<"display">, node: YogaNode) {
        node.setDisplay(next === "flex" ? Yg.DISPLAY_FLEX : Yg.DISPLAY_NONE);
    }

    public static height(next: S<"height">, node: YogaNode) {
        if (typeof next === "number") {
            node.setHeight(next);
        } else if (typeof next === "string") {
            node.setHeightPercent(Number.parseInt(next, 10));
        } else {
            node.setHeightAuto();
        }
    }
    public static width(next: S<"width">, node: YogaNode) {
        if (typeof next === "number") {
            node.setWidth(next);
        } else if (typeof next === "string") {
            node.setWidthPercent(Number.parseInt(next, 10));
        } else {
            node.setWidthAuto();
        }
    }

    public static minWidth(next: S<"minWidth">, node: YogaNode) {
        if (typeof next === "string") {
            node.setMinWidthPercent(Number.parseInt(next, 10));
        } else {
            node.setMinWidth(next ?? 0);
        }
    }

    public static minHeight(next: S<"minHeight">, node: YogaNode) {
        if (typeof next === "string") {
            node.setMinHeightPercent(Number.parseInt(next, 10));
        } else {
            node.setMinHeight(next ?? 0);
        }
    }
    public static marginTop(next: S<"marginTop">, node: YogaNode) {
        node.setMargin(Yg.EDGE_TOP, next ?? 0);
    }

    public static marginRight(next: S<"marginRight">, node: YogaNode) {
        node.setMargin(Yg.EDGE_RIGHT, next ?? 0);
    }

    public static marginBottom(next: S<"marginBottom">, node: YogaNode) {
        node.setMargin(Yg.EDGE_BOTTOM, next ?? 0);
    }

    public static marginLeft(next: S<"marginLeft">, node: YogaNode) {
        node.setMargin(Yg.EDGE_LEFT, next ?? 0);
    }

    public static paddingTop(
        next: S<"paddingTop">,
        node: YogaNode,
        shadow: ShadowStyleProxy,
    ) {
        node.setPadding(
            Yg.EDGE_TOP,
            Math.max(next ?? 0, shadow._scrollbarPaddingTop ?? 0),
        );
    }

    public static paddingBottom(
        next: S<"paddingBottom">,
        node: YogaNode,
        shadow: ShadowStyleProxy,
    ) {
        node.setPadding(
            Yg.EDGE_BOTTOM,
            Math.max(next ?? 0, shadow._scrollbarPaddingBottom ?? 0),
        );
    }

    public static paddingLeft(
        next: S<"paddingLeft">,
        node: YogaNode,
        shadow: ShadowStyleProxy,
    ) {
        node.setPadding(
            Yg.EDGE_LEFT,
            Math.max(next ?? 0, shadow._scrollbarPaddingLeft ?? 0),
        );
    }

    public static paddingRight(
        next: S<"paddingRight">,
        node: YogaNode,
        shadow: ShadowStyleProxy,
    ) {
        node.setPadding(
            Yg.EDGE_RIGHT,
            Math.max(next ?? 0, shadow._scrollbarPaddingRight ?? 0),
        );
    }

    public static _scrollbarPaddingTop(
        next: S<"_scrollbarPaddingTop">,
        node: YogaNode,
        shadow: ShadowStyleProxy,
    ) {
        // prettier-ignore
        node.setPadding(
            Yg.EDGE_TOP,
            Math.max(next ?? 0, shadow.paddingTop ?? 0),
        );
    }

    public static _scrollbarPaddingBottom(
        next: S<"_scrollbarPaddingBottom">,
        node: YogaNode,
        shadow: ShadowStyleProxy,
    ) {
        // prettier-ignore
        node.setPadding(
            Yg.EDGE_BOTTOM,
            Math.max(next ?? 0, shadow.paddingBottom ?? 0),
        );
    }

    public static _scrollbarPaddingLeft(
        next: S<"_scrollbarPaddingLeft">,
        node: YogaNode,
        shadow: ShadowStyleProxy,
    ) {
        // prettier-ignore
        node.setPadding(
            Yg.EDGE_LEFT,
            Math.max(next ?? 0, shadow.paddingLeft ?? 0),
        );
    }

    public static _scrollbarPaddingRight(
        next: S<"_scrollbarPaddingRight">,
        node: YogaNode,
        shadow: ShadowStyleProxy,
    ) {
        // prettier-ignore
        node.setPadding(
            Yg.EDGE_RIGHT,
            Math.max(next ?? 0, shadow.paddingRight ?? 0),
        );
    }

    public static borderTop(
        next: S<"borderTop">,
        node: YogaNode,
        shadow: ShadowStyleProxy,
    ) {
        node.setBorder(
            Yg.EDGE_TOP,
            Math.max(next ? 1 : 0, shadow._scrollbarBorderTop ?? 0),
        );
    }

    public static borderBottom(
        next: S<"borderBottom">,
        node: YogaNode,
        shadow: ShadowStyleProxy,
    ) {
        node.setBorder(
            Yg.EDGE_BOTTOM,
            Math.max(next ? 1 : 0, shadow._scrollbarBorderBottom ?? 0),
        );
    }

    public static borderLeft(
        next: S<"borderLeft">,
        node: YogaNode,
        shadow: ShadowStyleProxy,
    ) {
        node.setBorder(
            Yg.EDGE_LEFT,
            Math.max(next ? 1 : 0, shadow._scrollbarBorderLeft ?? 0),
        );
    }

    public static borderRight(
        next: S<"borderRight">,
        node: YogaNode,
        shadow: ShadowStyleProxy,
    ) {
        node.setBorder(
            Yg.EDGE_RIGHT,
            Math.max(next ? 1 : 0, shadow._scrollbarBorderRight ?? 0),
        );
    }

    public static _scrollbarBorderTop(
        next: S<"_scrollbarBorderTop">,
        node: YogaNode,
        shadow: ShadowStyleProxy,
    ) {
        // prettier-ignore
        node.setBorder(
            Yg.EDGE_TOP,
            Math.max(next ?? 0, shadow.borderTop ? 1 : 0),
        );
    }

    public static _scrollbarBorderBottom(
        next: S<"_scrollbarBorderBottom">,
        node: YogaNode,
        shadow: ShadowStyleProxy,
    ) {
        // prettier-ignore
        node.setBorder(
            Yg.EDGE_BOTTOM,
            Math.max(next ?? 0, shadow.borderBottom ? 1 : 0),
        );
    }

    public static _scrollbarBorderRight(
        next: S<"_scrollbarBorderRight">,
        node: YogaNode,
        shadow: ShadowStyleProxy,
    ) {
        // prettier-ignore
        node.setBorder(
            Yg.EDGE_RIGHT,
            Math.max(next ?? 0, shadow.borderRight ? 1 : 0),
        );
    }

    public static _scrollbarBorderLeft(
        next: S<"_scrollbarBorderLeft">,
        node: YogaNode,
        shadow: ShadowStyleProxy,
    ) {
        // prettier-ignore
        node.setBorder(
            Yg.EDGE_LEFT,
            Math.max(next ?? 0, shadow.borderLeft ? 1 : 0),
        );
    }

    public static columnGap(next: S<"columnGap">, node: YogaNode) {
        node.setGap(Yg.GUTTER_COLUMN, next ?? 0);
    }

    public static rowGap(next: S<"rowGap">, node: YogaNode) {
        node.setGap(Yg.GUTTER_ROW, next ?? 0);
    }

    public static flexGrow(next: S<"flexGrow">, node: YogaNode) {
        node.setFlexGrow(next ?? 0);
    }

    public static flexShrink(next: S<"flexShrink">, node: YogaNode) {
        node.setFlexShrink(next ?? 0);
    }

    public static flexWrap(next: S<"flexWrap">, node: YogaNode) {
        if (next === "wrap") {
            node.setFlexWrap(Yg.WRAP_WRAP);
        } else if (next === "nowrap") {
            node.setFlexWrap(Yg.WRAP_NO_WRAP);
        } else if (next === "wrap-reverse") {
            node.setFlexWrap(Yg.WRAP_WRAP_REVERSE);
        }
    }

    public static flexDirection(next: S<"flexDirection">, node: YogaNode) {
        if (next === "row") {
            node.setFlexDirection(Yg.FLEX_DIRECTION_ROW);
        } else if (next === "row-reverse") {
            node.setFlexDirection(Yg.FLEX_DIRECTION_ROW_REVERSE);
        } else if (next === "column") {
            node.setFlexDirection(Yg.FLEX_DIRECTION_COLUMN);
        } else if (next === "column-reverse") {
            node.setFlexDirection(Yg.FLEX_DIRECTION_COLUMN_REVERSE);
        }
    }

    public static flexBasis(next: S<"flexBasis">, node: YogaNode) {
        if (typeof next === "number") {
            node.setFlexBasis(next);
        } else if (typeof next === "string") {
            node.setFlexBasisPercent(Number.parseInt(next, 10));
        } else {
            node.setFlexBasis(Number.NaN);
        }
    }

    public static alignItems(next: S<"alignItems">, node: YogaNode) {
        if (next === "stretch" || !next) {
            node.setAlignItems(Yg.ALIGN_STRETCH);
        } else if (next === "flex-start") {
            node.setAlignItems(Yg.ALIGN_FLEX_START);
        } else if (next === "center") {
            node.setAlignItems(Yg.ALIGN_CENTER);
        } else if (next === "flex-end") {
            node.setAlignItems(Yg.ALIGN_FLEX_END);
        }
    }

    public static alignSelf(next: S<"alignSelf">, node: YogaNode) {
        if (!next) {
            node.setAlignSelf(Yg.ALIGN_AUTO);
        } else if (next === "flex-start") {
            node.setAlignSelf(Yg.ALIGN_FLEX_START);
        } else if (next === "flex-end") {
            node.setAlignSelf(Yg.ALIGN_FLEX_END);
        } else if (next === "center") {
            node.setAlignSelf(Yg.ALIGN_CENTER);
        }
    }

    public static justifyContent(next: S<"justifyContent">, node: YogaNode) {
        if (next === "flex-start" || !next) {
            node.setJustifyContent(Yg.JUSTIFY_FLEX_START);
        } else if (next === "flex-end") {
            node.setJustifyContent(Yg.JUSTIFY_FLEX_END);
        } else if (next === "center") {
            node.setJustifyContent(Yg.JUSTIFY_CENTER);
        } else if (next === "space-between") {
            node.setJustifyContent(Yg.JUSTIFY_SPACE_BETWEEN);
        } else if (next === "space-around") {
            node.setJustifyContent(Yg.JUSTIFY_SPACE_AROUND);
        } else if (next === "space-evenly") {
            node.setJustifyContent(Yg.JUSTIFY_SPACE_EVENLY);
        }
    }
}
