import { setMouse } from "term-keymap";
import { Root } from "../dom/Root.js";
import { Ansi } from "../util/Ansi.js";

class TermscapeError extends Error {
    constructor(msg?: string) {
        super(msg);
        this.name = "TermscapeError";
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

    const stdout = root?.runtime.stdout ?? process.stdout;

    // If root, exit function will handle runtime cleanup.
    // Otherwise, ensure certain cleanup is handled
    if (root) {
        root.exit();
    } else {
        stdout.write(Ansi.restoreFromKittyProtocol);
        stdout.write(Ansi.exitAltScreen);
        setMouse(false, stdout);
    }

    if (error.stack) {
        stdout.write(`${error.stack}\n`);
        process.exit();
    } else {
        throw error;
    }
}
