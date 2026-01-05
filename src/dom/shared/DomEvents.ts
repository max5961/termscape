import type {
    MouseEventType,
    MouseEvent,
    EventEmitterMap,
    EventHandler,
    Event,
    FocusEvent,
    ConsoleEvent,
} from "../../Types.js";
import type { DomElement } from "../DomElement.js";

/* eslint-disable @typescript-eslint/no-unsafe-function-type */

export class DomEvents {
    private _host: DomElement;

    // private _emitter = new EventEmitter();
    private _listeners = new Map<Event, Set<Function>>();
    private _setters = new Map<Event, Function | undefined>();

    constructor(host: DomElement) {
        this._host = host;
    }

    public addListener<T extends Event>(event: T, handler: EventHandler<T>) {
        if (!this._listeners.get(event)) {
            this._listeners.set(event, new Set());
        }

        this._listeners.get(event)!.add(handler);
        return () => this._listeners.get(event)?.delete(handler);
    }

    public removeListener<T extends Event>(event: T, handler: EventHandler<T>) {
        this._listeners.get(event)?.delete(handler);
    }

    public setSingle<T extends Event>(event: T, handler: EventHandler<T> | undefined) {
        this._setters.set(event, handler);
    }

    public getSingle<T extends Event>(event: T) {
        return this._setters.get(event) as undefined | EventHandler<T>;
    }

    public hasListeners(event: Event): boolean {
        return !!this._listeners.get(event)?.size || !!this._setters.get(event);
    }

    public getListeners<T extends Event>(event: T): EventHandler<T>[] {
        const result: EventHandler<T>[] = [];

        const single = this._setters.get(event);
        const many = this._listeners.get(event)?.values();

        if (single) result.push(single as EventHandler<T>);
        if (many) result.push(...(many as SetIterator<EventHandler<T>>));

        return result;
    }

    public dispatchMouseEvent(...[x, y, type]: EventEmitterMap["MouseEvent"]) {
        this.propagateMouseEvent(x, y, type);
    }

    public dispatchFocusEvent(_event: FocusEvent) {
        //
    }

    public dispatchConsoleEvent(_event: ConsoleEvent) {
        //
    }

    protected propagateMouseEvent(x: number, y: number, type: MouseEventType) {
        let canPropagate = true;
        let canImmediatePropagate = true;

        const propagate = (curr: DomElement, target: DomElement) => {
            const handlers = curr._events.getListeners(type);

            if (handlers.length) {
                const event: MouseEvent = {
                    type,
                    clientX: x,
                    clientY: y,
                    target: target,
                    currentTarget: curr,
                    stopPropagation: () => {
                        canPropagate = false;
                    },
                    stopImmediatePropagation: () => {
                        canImmediatePropagate = false;
                        canPropagate = false;
                    },
                };

                handlers?.forEach((h) => {
                    if (canImmediatePropagate) {
                        h.call(curr, event);
                    }
                });
            }

            if (canPropagate && curr.parentElement) {
                propagate(curr.parentElement, target);
            }
        };

        propagate(this._host, this._host);
    }
}
