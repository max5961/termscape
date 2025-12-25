import Yoga from "yoga-wasm-web/auto";
import type { YogaNode, DomElement } from "../Types.js";
import type { BaseShadowStyle, BaseStyle } from "./Style.js";
import type { FocusManagerProps } from "../Props.js";
import type { FocusManager } from "../dom/DomElement.js";
import { decodeShorthand } from "./util/decodeShorthand.js";
import { ifUndef } from "../Util.js";
import { parseDimensions } from "./util/parseDimensions.js";

/**
 * The set handler in the Proxy for BaseShadowStyle passes the `prop` and `newValue` through
 * a series of hashable objects defined here.  This aims to allow rendering to focus
 * more on using data rather than interpreting it.
 *
 * 1) **SanitizerHandlers**
 *        - Returns normalized values. (e.g., converts `"auto"` to its default
 *          value).  Must return the value rather than apply directly to the
 *          `target[prop]` to avoid getting caught in the set trap.
 * 2) **AggregateHandlers**
 *        - Handles styles which by themselves provide no usable data to the
 *          renderer.  For example, `margin` can be thought of as a shorthand for setting `marginTop,Bottom,Right,Left`.  By itself, the renderer
 *          and yoga-layout cannot safely go by just the `margin` value.  It
 *          needs to know the context of the other margin settings.  Styles from
 *          aggregates have consumers that can only be set if they are
 *          undefined.
 * 3) **YogaHandlers**
 *        - Applies styles to the Yoga node
 */

// =============================================================================
// SANITIZE DATA
// =============================================================================

export const SanitizerHandlers: {
    [P in keyof BaseStyle]: (
        nextVal: BaseStyle[P],
        stdout: NodeJS.WriteStream,
        elem: DomElement,
    ) => BaseShadowStyle[P];
} = {
    zIndex(nextVal) {
        if (typeof nextVal === "string") {
            return 0;
        } else {
            return nextVal ?? 0;
        }
    },
    // Pruning out "auto" here even though there aren't any corresponding Yoga
    // styles to give it.  The Yoga Handler for alignSelf will interpret
    // undefined as auto.
    alignSelf(nextVal) {
        if (nextVal === "auto") {
            return undefined;
        } else {
            return nextVal;
        }
    },
    height(newVal, stdout) {
        return parseDimensions(newVal, stdout, "vh");
    },
    width(newVal, stdout) {
        return parseDimensions(newVal, stdout, "vw");
    },
    minHeight(newVal, stdout) {
        return parseDimensions(newVal, stdout, "vh");
    },
    minWidth(newVal, stdout) {
        return parseDimensions(newVal, stdout, "vw");
    },
    overflow(newVal) {
        return newVal ?? "visible";
    },
    overflowX(newVal) {
        return newVal ?? "visible";
    },
    overflowY(newVal) {
        return newVal ?? "visible";
    },
    flexShrink(nextVal, _stdout, elem) {
        const blockedByParent = (
            elem.parentElement as FocusManager<{
                Style: BaseStyle;
                Props: FocusManagerProps;
            }>
        )?.getProp("blockChildrenShrink");

        if (blockedByParent) {
            return 0;
        } else {
            return nextVal;
        }
    },
} as const;

// =============================================================================
// HANDLE AGGREGATES
// =============================================================================

export const AggregateHandlers: {
    [P in keyof BaseShadowStyle]: (
        next: BaseShadowStyle[P],
        target: BaseShadowStyle,
        virtual: BaseStyle,
    ) => void;
} = {
    borderStyle(next, target, _virtual) {
        target.borderTop = !!next;
        target.borderBottom = !!next;
        target.borderLeft = !!next;
        target.borderRight = !!next;
    },
    borderColor(next, target, virtual) {
        target.borderTopColor = ifUndef(virtual.borderTopColor, next);
        target.borderBottomColor = ifUndef(virtual.borderBottomColor, next);
        target.borderLeftColor = ifUndef(virtual.borderLeftColor, next);
        target.borderRightColor = ifUndef(virtual.borderRightColor, next);
    },
    borderDimColor(next, target, virtual) {
        target.borderTopDimColor = ifUndef(virtual.borderTopDimColor, next);
        target.borderBottomDimColor = ifUndef(virtual.borderBottomDimColor, next);
        target.borderLeftDimColor = ifUndef(virtual.borderLeftDimColor, next);
        target.borderRightDimColor = ifUndef(virtual.borderRightDimColor, next);
    },
    overflow(next, target, virtual) {
        target.overflowX = ifUndef(virtual.overflowX, next);
        target.overflowY = ifUndef(virtual.overflowY, next);
    },
    margin(next, target, virtual) {
        const [top, right, bottom, left] = decodeShorthand(next);
        target.marginTop = ifUndef(virtual.marginTop, top);
        target.marginRight = ifUndef(virtual.marginRight, right);
        target.marginBottom = ifUndef(virtual.marginBottom, bottom);
        target.marginLeft = ifUndef(virtual.marginLeft, left);
    },
    marginX(next, target, virtual) {
        target.marginRight = ifUndef(virtual.marginRight, next);
        target.marginLeft = ifUndef(virtual.marginLeft, next);
    },
    marginY(next, target, virtual) {
        target.marginTop = ifUndef(virtual.marginTop, next);
        target.marginBottom = ifUndef(virtual.marginBottom, next);
    },
    padding(next, target, virtual) {
        const [top, right, bottom, left] = decodeShorthand(next);
        target.paddingTop = ifUndef(virtual.paddingTop, top);
        target.paddingRight = ifUndef(virtual.paddingRight, right);
        target.paddingBottom = ifUndef(virtual.paddingBottom, bottom);
        target.paddingLeft = ifUndef(virtual.paddingLeft, left);
    },
    gap(next, target, virtual) {
        target.rowGap = ifUndef(virtual.rowGap, next);
        target.columnGap = ifUndef(virtual.columnGap, next);
    },
} as const;

// =============================================================================
// APPLY YOGA STYLES
// =============================================================================

export const YogaHandlers: {
    [P in keyof BaseShadowStyle]: (
        next: BaseShadowStyle[P],
        node: YogaNode,
        target: BaseShadowStyle,
        virtual: BaseStyle,
    ) => void;
} = {
    display(next, node) {
        node.setDisplay(next === "flex" ? Yoga.DISPLAY_FLEX : Yoga.DISPLAY_NONE);
    },
    height(next, node) {
        if (typeof next === "number") {
            node.setHeight(next);
        } else if (typeof next === "string") {
            node.setHeightPercent(Number.parseInt(next, 10));
        } else {
            node.setHeightAuto();
        }
    },
    width(next, node) {
        if (typeof next === "number") {
            node.setWidth(next);
        } else if (typeof next === "string") {
            node.setWidthPercent(Number.parseInt(next, 10));
        } else {
            node.setWidthAuto();
        }
    },
    minWidth(next, node) {
        if (typeof next === "string") {
            node.setMinWidthPercent(Number.parseInt(next, 10));
        } else {
            node.setMinWidth(next ?? 0);
        }
    },
    minHeight(next, node) {
        if (typeof next === "string") {
            node.setMinHeightPercent(Number.parseInt(next, 10));
        } else {
            node.setMinHeight(next ?? 0);
        }
    },
    marginTop(next, node) {
        node.setMargin(Yoga.EDGE_TOP, next ?? 0);
    },
    marginRight(next, node) {
        node.setMargin(Yoga.EDGE_RIGHT, next ?? 0);
    },
    marginBottom(next, node) {
        node.setMargin(Yoga.EDGE_BOTTOM, next ?? 0);
    },
    marginLeft(next, node) {
        node.setMargin(Yoga.EDGE_LEFT, next ?? 0);
    },
    paddingTop(next, node, target) {
        node.setPadding(
            Yoga.EDGE_TOP,
            Math.max(next ?? 0, target.scrollbarPaddingTop ?? 0),
        );
    },
    paddingBottom(next, node, target) {
        node.setPadding(
            Yoga.EDGE_BOTTOM,
            Math.max(next ?? 0, target.scrollbarPaddingBottom ?? 0),
        );
    },
    paddingLeft(next, node, target) {
        node.setPadding(
            Yoga.EDGE_LEFT,
            Math.max(next ?? 0, target.scrollbarPaddingLeft ?? 0),
        );
    },
    paddingRight(next, node, target) {
        node.setPadding(
            Yoga.EDGE_RIGHT,
            Math.max(next ?? 0, target.scrollbarPaddingRight ?? 0),
        );
    },
    scrollbarPaddingTop(next, node, target) {
        // prettier-ignore
        node.setPadding(
            Yoga.EDGE_TOP,
            Math.max(next ?? 0, target.paddingTop ?? 0),
        );
    },
    scrollbarPaddingBottom(next, node, target) {
        // prettier-ignore
        node.setPadding(
            Yoga.EDGE_BOTTOM,
            Math.max(next ?? 0, target.paddingBottom ?? 0),
        );
    },
    scrollbarPaddingLeft(next, node, target) {
        // prettier-ignore
        node.setPadding(
            Yoga.EDGE_LEFT,
            Math.max(next ?? 0, target.paddingLeft ?? 0),
        );
    },
    scrollbarPaddingRight(next, node, target) {
        // prettier-ignore
        node.setPadding(
            Yoga.EDGE_RIGHT,
            Math.max(next ?? 0, target.paddingRight ?? 0),
        );
    },
    borderTop(next, node, target) {
        node.setBorder(
            Yoga.EDGE_TOP,
            Math.max(next ? 1 : 0, target.scrollbarBorderTop ?? 0),
        );
    },
    borderBottom(next, node, target) {
        node.setBorder(
            Yoga.EDGE_BOTTOM,
            Math.max(next ? 1 : 0, target.scrollbarBorderBottom ?? 0),
        );
    },
    borderLeft(next, node, target) {
        node.setBorder(
            Yoga.EDGE_LEFT,
            Math.max(next ? 1 : 0, target.scrollbarBorderLeft ?? 0),
        );
    },
    borderRight(next, node, target) {
        node.setBorder(
            Yoga.EDGE_RIGHT,
            Math.max(next ? 1 : 0, target.scrollbarBorderRight ?? 0),
        );
    },
    scrollbarBorderTop(next, node, target) {
        // prettier-ignore
        node.setBorder(
            Yoga.EDGE_TOP,
            Math.max(next ?? 0, target.borderTop ? 1 : 0),
        );
    },
    scrollbarBorderBottom(next, node, target) {
        // prettier-ignore
        node.setBorder(
            Yoga.EDGE_BOTTOM,
            Math.max(next ?? 0, target.borderBottom ? 1 : 0),
        );
    },
    scrollbarBorderRight(next, node, target) {
        // prettier-ignore
        node.setBorder(
            Yoga.EDGE_RIGHT,
            Math.max(next ?? 0, target.borderRight ? 1 : 0),
        );
    },
    scrollbarBorderLeft(next, node, target) {
        // prettier-ignore
        node.setBorder(
            Yoga.EDGE_LEFT,
            Math.max(next ?? 0, target.borderLeft ? 1 : 0),
        );
    },
    columnGap(next, node) {
        node.setGap(Yoga.GUTTER_COLUMN, next ?? 0);
    },
    rowGap(next, node) {
        node.setGap(Yoga.GUTTER_ROW, next ?? 0);
    },
    flexGrow(next, node) {
        node.setFlexGrow(next ?? 0);
    },
    flexShrink(next, node) {
        node.setFlexShrink(next ?? 0);
    },
    flexWrap(next, node) {
        if (next === "wrap") {
            node.setFlexWrap(Yoga.WRAP_WRAP);
        } else if (next === "nowrap") {
            node.setFlexWrap(Yoga.WRAP_NO_WRAP);
        } else if (next === "wrap-reverse") {
            node.setFlexWrap(Yoga.WRAP_WRAP_REVERSE);
        }
    },
    // prettier-ignore
    flexDirection(next, node) {
        if (next === "row") {
            node.setFlexDirection(Yoga.FLEX_DIRECTION_ROW);
        } else if (next === "row-reverse") {
            node.setFlexDirection(Yoga.FLEX_DIRECTION_ROW_REVERSE);
        } else if (next === "column") {
            node.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN);
        } else if (next === "column-reverse") {
            node.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN_REVERSE);
        }
    },
    flexBasis(next, node) {
        if (typeof next === "number") {
            node.setFlexBasis(next);
        } else if (typeof next === "string") {
            node.setFlexBasisPercent(Number.parseInt(next, 10));
        } else {
            node.setFlexBasis(Number.NaN);
        }
    },
    alignItems(next, node) {
        if (next === "stretch" || !next) {
            node.setAlignItems(Yoga.ALIGN_STRETCH);
        } else if (next === "flex-start") {
            node.setAlignItems(Yoga.ALIGN_FLEX_START);
        } else if (next === "center") {
            node.setAlignItems(Yoga.ALIGN_CENTER);
        } else if (next === "flex-end") {
            node.setAlignItems(Yoga.ALIGN_FLEX_END);
        }
    },
    alignSelf(next, node) {
        if (!next) {
            node.setAlignSelf(Yoga.ALIGN_AUTO);
        } else if (next === "flex-start") {
            node.setAlignSelf(Yoga.ALIGN_FLEX_START);
        } else if (next === "flex-end") {
            node.setAlignSelf(Yoga.ALIGN_FLEX_END);
        } else if (next === "center") {
            node.setAlignSelf(Yoga.ALIGN_CENTER);
        }
    },
    justifyContent(next, node) {
        if (next === "flex-start" || !next) {
            node.setJustifyContent(Yoga.JUSTIFY_FLEX_START);
        } else if (next === "flex-end") {
            node.setJustifyContent(Yoga.JUSTIFY_FLEX_END);
        } else if (next === "center") {
            node.setJustifyContent(Yoga.JUSTIFY_CENTER);
        } else if (next === "space-between") {
            node.setJustifyContent(Yoga.JUSTIFY_SPACE_BETWEEN);
        } else if (next === "space-around") {
            node.setJustifyContent(Yoga.JUSTIFY_SPACE_AROUND);
        } else if (next === "space-evenly") {
            node.setJustifyContent(Yoga.JUSTIFY_SPACE_EVENLY);
        }
    },
} as const;
