import type { Style, Shadow } from "../Style.js";
import type { FocusManager } from "../../FocusManager.js";
import type { DomElement } from "../../DomElement.js";
import type { ViewportStyle } from "../../../Types.js";

type S<T extends keyof Style.All> = Style.All[T];
type SS<T extends keyof Style.All> = Shadow<Style.All>[T];

export class Sanitizers {
    private static parseDim(
        dim: string | number | undefined,
        stdout: NodeJS.WriteStream,
        host: DomElement,
        style: ViewportStyle,
    ) {
        if (typeof dim !== "string") return dim;
        dim = dim.trimEnd();
        const vh = dim.endsWith("vh");
        const vw = dim.endsWith("vw");
        if (vh || vw) {
            // side effect
            host._metadata.markAsViewport(style);

            const pct = Number.parseInt(dim, 10) / 100;
            const stdoutDim = vh ? stdout.rows : stdout.columns;
            return Math.round(stdoutDim * pct);
        }
        return dim;
    }

    public static height(
        next: S<"height">,
        stdout: NodeJS.WriteStream,
        host: DomElement,
    ): SS<"height"> {
        return Sanitizers.parseDim(next, stdout, host, "height");
    }

    public static width(
        next: S<"height">,
        stdout: NodeJS.WriteStream,
        host: DomElement,
    ): SS<"width"> {
        return Sanitizers.parseDim(next, stdout, host, "width");
    }

    public static minHeight(
        next: S<"minHeight">,
        stdout: NodeJS.WriteStream,
        host: DomElement,
    ): SS<"minHeight"> {
        return Sanitizers.parseDim(next, stdout, host, "minHeight");
    }

    public static minWidth(
        next: S<"minWidth">,
        stdout: NodeJS.WriteStream,
        host: DomElement,
    ): SS<"minWidth"> {
        return Sanitizers.parseDim(next, stdout, host, "minWidth");
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
