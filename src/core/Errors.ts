import { Ansi } from "./Ansi.js";
import { CurrentRuntime } from "./runtime/CurrentRuntime.js";

export class TermscapeError extends Error {
    constructor(msg?: string) {
        super(msg);
        this.name = Ansi.style.cyan + "TermscapeError" + Ansi.style.reset;
    }
}

export function throwError(cb: (messages: Messages) => string): never {
    const error = new TermscapeError(cb(messages));
    TermscapeError.captureStackTrace(error, throwError);

    if (CurrentRuntime.ref) {
        CurrentRuntime.ref.endRuntime(error);
    } else {
        throw error;
    }

    return undefined as never;
}

type Messages = typeof messages;
const messages = {
    insertBefore: {
        beforeChildNotChild:
            "Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.",
        invalidArgs:
            "Failed to execute 'insertBefore' on 'Node': At least 2 arguments required, but only 1 passed",
    },
    removeChild: {
        childNotChild:
            "Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.",
    },
} as const;
