import { MouseEventType } from "../stdin/types.js";
import { stringEnum } from "../util/stringEnum.js";
import { DomElement } from "./DomElement.js";

export const MouseEvent = stringEnum(
    "Click",
    "DoubleClick",
    "RightClick",
    "RightDoubleClick",
    "MouseDown",
    "MouseUp",
    "RightMouseDown",
    "RightMouseUp",
    "ScrollDown",
    "ScrollUp",
);

export type MouseEvent = keyof typeof MouseEvent;

export type Event = {
    type: MouseEventType;
    clientX: number;
    clientY: number;
    target: DomElement;
    currentTarget: DomElement;
    stopPropagation: () => void;
    stopImmediatePropagation: () => void;
};

export type EventHandler = (e: Event) => unknown;
