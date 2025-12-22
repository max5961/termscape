import { setMouse } from "term-keymap";
import type { Root } from "../dom/Root.js";
import { Ansi } from "./Ansi.js";

export class TermscapeError extends Error {
    constructor(msg?: string) {
        super(msg);
        this.name = Ansi.style.cyan + "TermscapeError" + Ansi.style.reset;
    }

    public static removeChild(root: Root | null) {
        throwError(
            root,
            "Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.",
        );
    }
}

export function throwError(root: Root | null, msg: string): never;
export function throwError(root: Root | null, error: Error): never;
export function throwError(root: Root | null, msgOrError: string | Error): never {
    let error = msgOrError as Error;

    if (typeof msgOrError === "string") {
        error = new TermscapeError(msgOrError);
        TermscapeError.captureStackTrace(error, throwError);
    }

    if (root) {
        root.exit(error);
    } else {
        process.stdout.write(Ansi.restoreFromKittyProtocol);
        process.stdout.write(Ansi.exitAltScreen);
        setMouse(false, process.stdout);
    }

    handleError(error);
}

export function handleError(error: Error): never {
    // Looks nicer to write just the stacktrace for internal errors, but that
    // doesn't allow for catching errors, so throw it.
    throw error;
}
