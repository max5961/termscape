type Color = any;

export type TextProps = {
    color?: Color;
    backgroundColor?: Color;
    dimColor?: boolean;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    inverse?: boolean;
    type?: "area" | "line";
};
