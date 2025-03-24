import Yoga, { Node as YogaNode } from "yoga-wasm-web/auto";
import { BoxStyle } from "../elements/attributes/box/BoxStyle.js";

/*
 * Used by DomElement.setProps
 * */

// The logic needs to be the *opposite* of what it currently is.  Currently iterating
// over the style prop, so if a diff goes from having a value to undefined, the
// YogaNode never gets reset.  The logic needs to be flipped
type Stylers<T extends object> = {
    [P in keyof T]: (node: YogaNode, value: T[P]) => void;
};

export const Box: Stylers<BoxStyle> = {
    position(node, value) {
        node.setPositionType(
            (() => {
                return value === "absolute"
                    ? Yoga.POSITION_TYPE_ABSOLUTE
                    : Yoga.POSITION_TYPE_RELATIVE;
            })(),
        );
    },
    zIndex(node, value) {
        // This is an outlier, because it goes more with the style prop, but its
        // not related to Yoga, so there are no Yoga settings for it.  Its only
        // used during rendering... can pull from styles when setting props
    },
    gap(node, value) {
        node.setGap(Yoga.GUTTER_ALL, value ?? 0);
    },
    columnGap(node, value) {
        node.setGap(Yoga.GUTTER_COLUMN, value ?? 0);
    },
    rowGap(node, value) {
        node.setGap(Yoga.GUTTER_ROW, value ?? 0);
    },
    margin(node, value) {
        if (typeof value === "number") {
            node.setMargin(Yoga.EDGE_ALL, value);
        }
        if (typeof value === "string") {
            node.setMarginPercent(Yoga.EDGE_ALL, Number.parseInt(value, 10));
            // Todo: parser for "t r b l" or "t r" format
        }
    },
    marginTop(node, value) {
        if (typeof value === "number") {
            node.setMargin(Yoga.EDGE_TOP, value ?? 0);
        }
        if (typeof value === "string") {
            node.setMarginPercent(Yoga.EDGE_TOP, 0);
        }
    },
    marginBottom(node, value) {
        node.setMargin(Yoga.EDGE_BOTTOM, value ?? 0);
    },
    marginLeft(node, value) {
        node.setMargin(Yoga.EDGE_LEFT, value ?? 0);
    },
    marginRight(node, value) {
        node.setMargin(Yoga.EDGE_RIGHT, value ?? 0);
    },
    marginX(node, value) {
        node.setMargin(Yoga.EDGE_HORIZONTAL, value ?? 0);
    },
    marginY(node, value) {
        node.setMargin(Yoga.EDGE_VERTICAL, value ?? 0);
    },
    justifyContent(node, value) {
        node.setJustifyContent(
            (() => {
                if (value === "flex-start") return Yoga.JUSTIFY_FLEX_START;
                if (value === "center") return Yoga.JUSTIFY_CENTER;
                if (value === "flex-end") return Yoga.JUSTIFY_FLEX_END;
                if (value === "space-between") return Yoga.JUSTIFY_SPACE_BETWEEN;
                if (value === "space-around") return Yoga.JUSTIFY_SPACE_AROUND;
                if (value === "space-evenly") return Yoga.JUSTIFY_SPACE_EVENLY;
                // Default
                return Yoga.JUSTIFY_FLEX_START;
            })(),
        );
    },

    alignItems(node, value) {
        node.setAlignItems(
            (() => {
                if (value === "flex-start") return Yoga.ALIGN_FLEX_START;
                if (value === "center") return Yoga.ALIGN_CENTER;
                if (value === "flex-end") return Yoga.ALIGN_FLEX_END;
                if (value === "stretch") return Yoga.ALIGN_STRETCH;
                // Default
                return Yoga.ALIGN_FLEX_START;
            })(),
        );
    },

    width(node, value) {
        if (typeof value === "string") {
            const number = Number.parseInt(value, 10);
            if (!Number.isNaN(number)) {
                return node.setWidthPercent(number);
            }
        }

        if (typeof value === "number") {
            return node.setWidth(value);
        }

        return node.setWidthAuto();
    },
} as const;

export const Stylers = { Box } as const;
