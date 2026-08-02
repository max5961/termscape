import type { Style, Shadow } from "../Style.js";
import type { FocusManager } from "../../FocusManager.js";
import type { DomElement } from "../../DomElement.js";

type S<T extends keyof Style.All> = Style.All[T];
type SS<T extends keyof Style.All> = Shadow<Style.All>[T];

export class Sanitizers {
    private static parseDim(
        dim: string | number | undefined,
        stdout: NodeJS.WriteStream,
    ) {
        if (typeof dim !== "string") return dim;
        dim = dim.trimEnd();
        const vh = dim.endsWith("vh");
        const vw = dim.endsWith("vw");
        if (vh || vw) {
            const pct = Number.parseInt(dim, 10) / 100;
            const stdoutDim = vh ? stdout.rows : stdout.columns;
            return Math.round(stdoutDim * pct);
        }
        return dim;
    }

    public static zIndex(next: S<"zIndex">): SS<"zIndex"> {
        if (typeof next === "string") {
            return 0;
        } else {
            return next ?? 0;
        }
    }

    public static alignSelf(next: S<"alignSelf">): SS<"alignSelf"> {
        if (next === "auto") {
            return undefined;
        } else {
            return next;
        }
    }

    public static height(next: S<"height">, stdout: NodeJS.WriteStream): SS<"height"> {
        return Sanitizers.parseDim(next, stdout);
    }

    public static width(next: S<"height">, stdout: NodeJS.WriteStream): SS<"width"> {
        return Sanitizers.parseDim(next, stdout);
    }

    public static minHeight(
        next: S<"minHeight">,
        stdout: NodeJS.WriteStream,
    ): SS<"minHeight"> {
        return Sanitizers.parseDim(next, stdout);
    }

    public static minWidth(
        next: S<"minWidth">,
        stdout: NodeJS.WriteStream,
    ): SS<"minWidth"> {
        return Sanitizers.parseDim(next, stdout);
    }

    public static overflow(next: S<"overflow">): SS<"overflow"> {
        return next ?? "visible";
    }

    public static overflowX(next: S<"overflowX">): SS<"overflowX"> {
        return next ?? "visible";
    }

    public static overflowY(next: S<"overflowY">): SS<"overflowY"> {
        return next ?? "visible";
    }

    public static flexShrink(next: S<"flexShrink">, elem: DomElement): SS<"flexShrink"> {
        const blockedByParent = (elem.parentElement as FocusManager)?.getProp(
            "blockChildrenShrink",
        );

        if (blockedByParent) {
            return 0;
        } else {
            return next;
        }
    }
}
