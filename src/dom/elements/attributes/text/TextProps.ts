import { TextStyle } from "./TextStyle.js";

export type TextProps = {
    style?: TextStyle | TextStyle[];
    numberOfLines?: number | "auto"; // default: auto (textarea)
    ellipsizeMode?: "start" | "middle" | "end"; // default: "end"
    leftActive?: TextStyle | TextStyle[];
    rightActive?: TextStyle | TextStyle[];
    onClick?: Function;
    onMouseDown?: Function;
    onMouseUp?: Function;
    /* rest of mouse event handlers */
};
