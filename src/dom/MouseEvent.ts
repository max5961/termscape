import { DomElement } from "./DomElement.js";

export type MouseEventType =
    // LEFT BTN
    | "click"
    | "dblclick"
    | "mousedown"
    | "mouseup"

    // RIGHT BTN
    | "rightclick"
    | "rightdblclick"
    | "rightmousedown"
    | "rightmouseup"

    // SCROLL WHEEL
    | "scrollup"
    | "scrolldown"
    | "scrollclick"
    | "scrolldblclick"
    | "scrollbtndown"
    | "scrollbtnup"

    // MOVEMENT
    | "mousemove"
    | "drag"
    | "dragstart"
    | "dragend";

export type MouseEvent = {
    type: MouseEventType;
    clientX: number;
    clientY: number;
    target: DomElement;
    currentTarget: DomElement;
    stopPropagation: () => void;
    stopImmediatePropagation: () => void;
};

export type MouseEventHandler = (e: MouseEvent) => unknown;
