import { TagNames } from "./constants.js";
import { BoxStyle } from "./elements/attributes/box/BoxStyle.js";
import { TextStyle } from "./elements/attributes/text/TextStyle.js";

export type TTagNames = (typeof TagNames)[keyof typeof TagNames];

export type Point = { x: number; y: number };

export type DOMRect = {
    x: number;
    y: number;
    height: number;
    bottom: number;
    width: number;
    top: number;
    left: number;
    right: number;
};

export type Style = BoxStyle | TextStyle;
