import Yoga from "yoga-wasm-web/auto";
import { Style, YogaNode } from "../types.js";
import { DomElement } from "./DomElement.js";

// Apply styles to the Yoga Node
export const yogaStyler: {
    [P in keyof Style]: (
        node: YogaNode,
        _elem: DomElement,
        value: number | string,
    ) => void;
} = {
    height(node, _elem, value) {
        node.setHeight(value);
    },
    width(node, _elem, value) {
        node.setWidth(value);
    },
    minWidth(node, _elem, value) {
        node.setMinWidth(value);
    },
    minHeight(node, _elem, value) {
        node.setMinHeight(value);
    },
    margin(node, _elem, value) {
        node.setMargin(Yoga.EDGE_ALL, value);
    },
    marginX(node, _elem, value) {
        node.setMargin(Yoga.EDGE_HORIZONTAL, value);
    },
    marginY(node, _elem, value) {
        node.setMargin(Yoga.EDGE_VERTICAL, value);
    },
    marginTop(node, _elem, value) {
        node.setMargin(Yoga.EDGE_TOP, value);
    },
    marginBottom(node, _elem, value) {
        node.setMargin(Yoga.EDGE_BOTTOM, value);
    },
    marginLeft(node, _elem, value) {
        node.setMargin(Yoga.EDGE_LEFT, value);
    },
    marginRight(node, _elem, value) {
        node.setMargin(Yoga.EDGE_RIGHT, value);
    },
    padding(node, _elem, value) {
        node.setPadding(Yoga.EDGE_ALL, value);
    },
    paddingX(node, _elem, value) {
        node.setPadding(Yoga.EDGE_HORIZONTAL, value);
    },
    paddingY(node, _elem, value) {
        node.setPadding(Yoga.EDGE_VERTICAL, value);
    },
    paddingTop(node, _elem, value) {
        node.setPadding(Yoga.EDGE_TOP, value);
    },
    paddingBottom(node, _elem, value) {
        node.setPadding(Yoga.EDGE_BOTTOM, value);
    },
    paddingLeft(node, _elem, value) {
        node.setPadding(Yoga.EDGE_LEFT, value);
    },
    paddingRight(node, _elem, value) {
        node.setPadding(Yoga.EDGE_RIGHT, value);
    },
    position(node, _elem, value) {
        if (value === "absolute") {
            node.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE);
        } else {
            node.setPositionType(Yoga.POSITION_TYPE_RELATIVE);
        }
    },
    display(node, _elem, value) {
        if (value === "flex") {
            node.setDisplay(Yoga.DISPLAY_FLEX);
        } else {
            node.setDisplay(Yoga.DISPLAY_NONE);
        }
    },
    flexGrow(node, _elem, value) {
        node.setFlexGrow(value as number);
    },
    flexShrink(node, _elem, value) {
        node.setFlexShrink(value as number);
    },
    flexBasis(node, _elem, value) {
        node.setFlexBasis(value);
    },
    flexWrap(node, _elem, value) {
        if (value === "nowrap") {
            node.setFlexWrap(Yoga.WRAP_NO_WRAP);
        }
        if (value === "wrap") {
            node.setFlexWrap(Yoga.WRAP_WRAP);
        }
        if (value === "wrap-reverse") {
            node.setFlexWrap(Yoga.WRAP_WRAP_REVERSE);
        }
    },
    flexDirection(node, _elem, value) {
        if (value === "row") {
            node.setFlexDirection(Yoga.FLEX_DIRECTION_ROW);
        }
        if (value === "row-reverse") {
            node.setFlexDirection(Yoga.FLEX_DIRECTION_ROW_REVERSE);
        }
        if (value === "column") {
            node.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN);
        }
        if (value === "column-reverse") {
            node.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN_REVERSE);
        }
    },
    alignItems(node, _elem, value) {
        if (value === "stretch" || !_elem.style.alignItems) {
            node.setAlignItems(Yoga.ALIGN_STRETCH);
        }
        if (value === "flex-start") {
            node.setAlignItems(Yoga.ALIGN_FLEX_START);
        }
        if (value === "center") {
            node.setAlignItems(Yoga.ALIGN_CENTER);
        }
        if (value === "flex-end") {
            node.setAlignItems(Yoga.ALIGN_FLEX_END);
        }
    },
    alignSelf(node, _elem, value) {
        if (value === "auto" || !_elem.style.alignSelf) {
            node.setAlignSelf(Yoga.ALIGN_AUTO);
        }
        if (value === "flex-start") {
            node.setAlignSelf(Yoga.ALIGN_FLEX_START);
        }
        if (value === "center") {
            node.setAlignSelf(Yoga.ALIGN_CENTER);
        }
        if (value === "flex-end") {
            node.setAlignSelf(Yoga.ALIGN_FLEX_END);
        }
    },
    justifyContent(node, _elem, value) {
        if (value === "flex-start" || !_elem.style.justifyContent) {
            node.setJustifyContent(Yoga.JUSTIFY_FLEX_START);
        }
        if (value === "center") {
            node.setJustifyContent(Yoga.JUSTIFY_CENTER);
        }
        if (value === "flex-end") {
            node.setJustifyContent(Yoga.JUSTIFY_FLEX_END);
        }
        if (value === "space-between") {
            node.setJustifyContent(Yoga.JUSTIFY_SPACE_BETWEEN);
        }
        if (value === "space-around") {
            node.setJustifyContent(Yoga.JUSTIFY_SPACE_AROUND);
        }
    },
    gap(node, _elem, value) {
        node.setGap(Yoga.GUTTER_ALL, value as number);
    },
    columnGap(node, _elem, value) {
        node.setGap(Yoga.GUTTER_COLUMN, value as number);
    },
    rowGap(node, _elem, value) {
        node.setGap(Yoga.GUTTER_ROW, value as number);
    },
    borderStyle(node, _elem, value) {
        node.setBorder(Yoga.EDGE_ALL, value as number);
    },
    borderTop(node, _elem, value) {
        node.setBorder(Yoga.EDGE_TOP, value as number);
    },
    borderBottom(node, _elem, value) {
        node.setBorder(Yoga.EDGE_BOTTOM, value as number);
    },
    borderLeft(node, _elem, value) {
        node.setBorder(Yoga.EDGE_LEFT, value as number);
    },
    borderRight(node, _elem, value) {
        node.setBorder(Yoga.EDGE_RIGHT, value as number);
    },
};

// type Norm<T extends Style, P extends keyof T> = Exclude<T[P], "inherit">;
// /** Must not call the setters to prevent triggering re-renders. */
// export const normalized = {
//     // =========================================================================
//     // Box
//     // =========================================================================
//
//     borderColor(_elem, value) {
//         return value;
//     },
// } as {
//     [P in keyof Style]: (_elem: DomElement, value: Style[P]) => Norm<Style, P>;
// };
//
// function findNextDefinedParent(_elem: DomElement, prop: keyof Style) {
//     let parent = _elem.parentElement;
//     while (parent) {
//         const style = parent.style[prop];
//         if (style !== undefined && style !== "inherit") {
//             return style;
//         }
//         parent = parent.parentElement;
//     }
//
//     return undefined;
// }
//
// function normalizeStyle(_elem: DomElement, prop: keyof Style, value: Style[keyof Style]) {
//     if (value === "inherit") {
//         return findNextDefinedParent(_elem, prop);
//     }
//
//     const method = normalized[prop];
//     if (!method) return;
//     return method(_elem, value);
// }
//
// function createProxy() {
//     for (const method of Object.keys(yogaStyler) as (keyof Style)[]) {
//         const original = yogaStyler[method];
//
//         if (original) {
//             yogaStyler[method] = function (node, _elem, value) {
//                 const nextValue = normalizeStyle(_elem, method, value);
//                 original(node, _elem, nextValue);
//             };
//         }
//     }
//
//     return yogaStyler;
// }
//
// export const dastyler = createProxy();
