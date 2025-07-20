import { BoxStyle } from "./BoxStyle.js";

export type BoxProps = {
    style?: BoxStyle;
    leftActive?: BoxStyle;
    rightActive?: BoxStyle;
    onClick?: Function;
    onDoubleClick?: Function;
    onMouseDown?: Function;
    onMouseUp?: Function;
    onRightClick?: Function;
    onRightDoubleClick?: Function;
    onRightMouseDown?: Function;
    onRightMouseUp?: Function;
    onScrollDown?: Function;
    onScrollUp?: Function;
    titleTopLeft?: any;
    titleTopCenter?: any;
    titleTopRight?: any;
    titleBottomLeft?: any;
    titleBottomCenter?: any;
    titleBottomRight?: any;
};
