import { BoxStyle } from "./BoxStyle.js";

export type BoxProps = {
    style: BoxStyle | BoxStyle[];
    onClick: Function;
    onRightClick: Function;
    onDoubleClick: Function;
    onRightDoubleClick: Function;
    onLeftMouseDown: Function;
    onRightMouseDown: Function;
    onLeftMouseUp: Function;
    onRightMouseUp: Function;
    onScrollDown: Function;
    onScrollUp: Function;
};
