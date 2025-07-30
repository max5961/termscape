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

export class Event {
    public readonly type: MouseEvent;
    public readonly clientX: number;
    public readonly clientY: number;
    public readonly target: DomElement;

    constructor({
        type,
        clientX,
        clientY,
        target,
    }: {
        type: MouseEvent;
        clientX: number;
        clientY: number;
        target: DomElement;
    }) {
        this.type = type;
        this.clientX = clientX;
        this.clientY = clientY;
        this.target = target;
    }

    public stopPropagation(): void {}
}

export type EventHandler = (e: Event) => unknown;
