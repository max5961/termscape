import { TextStyle } from "./TextStyle.js";

export type TextProps = {
    style?: TextStyle;
    leftActive?: TextStyle;
    rightActive?: TextStyle;
    numberOfLines?: number | "auto"; // default: auto (textarea)
    ellipsizeMode?: "start" | "middle" | "end"; // default: "end"
    onClick?: Function;
    onMouseDown?: Function;
    onMouseUp?: Function;
    /* rest of mouse event handlers */
};
