import { type BoxStyle } from "../dom/elements/attributes/box/BoxStyle.js";
import { type TextStyle } from "../dom/elements/attributes/text/TextStyle.js";

type Box = "Box";
type Text = "Text";

type InlineStyle<T> = T extends Box ? BoxStyle : T extends Text ? TextStyle : never;

export const StyleSheet = {
    create<T extends Box | Text>(
        _type: T,
        styles: Record<string, InlineStyle<T>>,
    ): Record<string, InlineStyle<T>> {
        return styles;
    },

    createInline<T extends Box | Text>(_type: T, styles: InlineStyle<T>): InlineStyle<T> {
        return styles;
    },
};
