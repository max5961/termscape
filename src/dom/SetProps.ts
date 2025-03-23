import Yoga, { Node as YogaNode } from "yoga-wasm-web/auto";
import { BoxStyle } from "../props/box/BoxStyle.js";

/*
 * Used by DomElement.setProps
 * */

type SetStyle<T extends object> = Partial<{
    [P in keyof T]: (node: YogaNode, value: T[P]) => void;
}>;

export const Box: SetStyle<BoxStyle> = {
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
};

export const SetStyle = { Box } as const;
