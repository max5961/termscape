import Yoga from "yoga-wasm-web/auto";
import { type YogaNode } from "../types.js";
import { type MinusInherit, type RStyle, type VStyle } from "../style/Style.js";

const neverThese =
    <U extends unknown>(these: readonly U[]) =>
    <T>(val: T | U, nextVal: T): Exclude<T, U> | undefined => {
        if (these.includes(val as unknown as U)) {
            return nextVal as Exclude<T, U> | undefined;
        }
        return val as Exclude<T, U> | undefined;
    };

const neverInherit = neverThese(["inherit"] as const);
const neverUndef = neverThese([undefined] as const);

const ifMut = <T>(val: T, cb: (next: T) => T | undefined) => {
    const result = cb(val);
    return result === undefined ? val : result;
};

const parseDimensions = (
    dim: string | number | undefined,
    stdout: NodeJS.WriteStream,
    endsWith: "vw" | "vh",
) => {
    return ifMut(dim, (n) => {
        if (typeof n !== "string") return;
        if (n.trimEnd().endsWith(endsWith)) {
            const pct = Number.parseInt(n, 10);
            return stdout[endsWith === "vh" ? "rows" : "columns"] * pct;
        }
        return;
    });
};

const ApplySanitizedStyle: {
    [P in keyof MinusInherit<VStyle>]: (
        node: YogaNode,
        realStyle: ReturnType<typeof createRealStyleProxy>,
        newVal: MinusInherit<VStyle>[P],
        stdout: NodeJS.WriteStream,
    ) => void;
} = {
    borderColor(_node, realStyle, newVal) {
        realStyle.borderColor = newVal;
    },

    // =========================================================================
    // DIMENSIONS
    // =========================================================================
    height(_node, realStyle, newVal, stdout) {
        realStyle.height = parseDimensions(newVal, stdout, "vh");
    },
    width(_node, realStyle, newVal, stdout) {
        realStyle.width = parseDimensions(newVal, stdout, "vw");
    },
    minHeight(_node, realStyle, newVal, stdout) {
        realStyle.height = parseDimensions(newVal, stdout, "vh");
    },
    minWidth(_node, realStyle, newVal, stdout) {
        realStyle.height = parseDimensions(newVal, stdout, "vw");
    },
};

const ApplyRealStyle: {
    [P in keyof RStyle]: (
        next: RStyle[P],
        target: ReturnType<typeof createRealStyleProxy>,
        node: YogaNode,
    ) => void;
} = {
    // =========================================================================
    // GROUPED STYLES
    // =========================================================================
    borderColor(next, target) {
        target.borderTopColor = neverUndef(target.borderTopColor, next);
        target.borderBottomColor = neverUndef(target.borderBottomColor, next);
        target.borderLeftColor = neverUndef(target.borderLeftColor, next);
        target.borderRightColor = neverUndef(target.borderRightColor, next);
    },
    borderDimColor(next, target) {
        target.borderTopDimColor = neverUndef(target.borderTopDimColor, next);
        target.borderBottomDimColor = neverUndef(target.borderBottomDimColor, next);
        target.borderLeftDimColor = neverUndef(target.borderLeftDimColor, next);
        target.borderRightDimColor = neverUndef(target.borderRightDimColor, next);
    },
    overflow(next, target) {
        target.overflowX = neverUndef(target.overflowX, next);
        target.overflowY = neverUndef(target.overflowY, next);
    },

    // =========================================================================
    // MARGIN
    // =========================================================================
    // margin(next, target) {
    //     target.marginTop = neverUndef(target.marginTop, next);
    //     target.marginBottom = neverUndef(target.marginBottom, next);
    //     target.marginRight = neverUndef(target.marginRight, next);
    //     target.marginLeft = neverUndef(target.marginLeft, next);
    // },
    marginX(next, target) {
        target.marginRight = neverUndef(target.marginRight, next);
        target.marginLeft = neverUndef(target.marginLeft, next);
    },
    marginY(next, target) {
        target.marginTop = neverUndef(target.marginTop, next);
        target.marginBottom = neverUndef(target.marginBottom, next);
    },
    marginTop(next, _target, node) {
        node.setMargin(Yoga.EDGE_TOP, next ?? 0);
    },
    marginRight(next, _target, node) {
        node.setMargin(Yoga.EDGE_RIGHT, next ?? 0);
    },
    marginBottom(next, _target, node) {
        node.setMargin(Yoga.EDGE_BOTTOM, next ?? 0);
    },
    marginLeft(next, _target, node) {
        node.setMargin(Yoga.EDGE_LEFT, next ?? 0);
    },

    // =========================================================================
    // PADDING
    // =========================================================================
    // padding(next, target) {
    //     target.paddingTop = neverUndef(target.paddingTop, next);
    //     target.paddingBottom = neverUndef(target.paddingBottom, next);
    //     target.paddingRight = neverUndef(target.paddingRight, next);
    //     target.paddingLeft = neverUndef(target.paddingLeft, next);
    // },
    paddingX(next, target) {
        target.paddingRight = neverUndef(target.paddingRight, next);
        target.paddingLeft = neverUndef(target.paddingLeft, next);
    },
    paddingY(next, target) {
        target.paddingTop = neverUndef(target.paddingTop, next);
        target.paddingBottom = neverUndef(target.paddingBottom, next);
    },
    paddingTop(next, _target, node) {
        node.setPadding(Yoga.EDGE_TOP, next ?? 0);
    },
    paddingBottom(next, _target, node) {
        node.setPadding(Yoga.EDGE_BOTTOM, next ?? 0);
    },
    paddingLeft(next, _target, node) {
        node.setPadding(Yoga.EDGE_LEFT, next ?? 0);
    },
    paddingRight(next, _target, node) {
        node.setPadding(Yoga.EDGE_RIGHT, next ?? 0);
    },

    // =========================================================================
    // DIMENSIONS
    // =========================================================================
    height(next, _target, node) {
        if (typeof next === "number") {
            node.setHeight(next);
        } else if (typeof next === "string") {
            node.setHeightPercent(Number.parseInt(next, 10));
        } else {
            node.setHeightAuto();
        }
    },
    width(next, _target, node) {
        if (typeof next === "number") {
            node.setWidth(next);
        } else if (typeof next === "string") {
            node.setWidthPercent(Number.parseInt(next, 10));
        } else {
            node.setWidthAuto();
        }
    },
    minWidth(next, _target, node) {
        if (typeof next === "string") {
            node.setMinWidthPercent(Number.parseInt(next, 10));
        } else {
            node.setMinWidth(next ?? 0);
        }
    },
    minHeight(next, _target, node) {
        if (typeof next === "string") {
            node.setMinHeightPercent(Number.parseInt(next, 10));
        } else {
            node.setMinHeight(next ?? 0);
        }
    },

    // =========================================================================
    // DISPLAY
    // =========================================================================
    display(next, _target, node) {
        node.setDisplay(next === "flex" ? Yoga.DISPLAY_FLEX : Yoga.DISPLAY_NONE);
    },

    // =========================================================================
    // BORDER
    // =========================================================================
    borderStyle(next, target, _node) {
        if (next) {
            target.borderTop = true;
            target.borderBottom = true;
            target.borderLeft = true;
            target.borderRight = true;
        }
    },
    borderTop(next, _target, node) {
        node.setBorder(Yoga.EDGE_TOP, next ? 1 : 0);
    },
    borderBottom(next, _target, node) {
        node.setBorder(Yoga.EDGE_BOTTOM, next ? 1 : 0);
    },
    borderLeft(next, _target, node) {
        node.setBorder(Yoga.EDGE_LEFT, next ? 1 : 0);
    },
    borderRight(next, _target, node) {
        node.setBorder(Yoga.EDGE_RIGHT, next ? 1 : 0);
    },

    // =========================================================================
    // BORDER
    // =========================================================================
    gap(next, target, _node) {
        target.rowGap = next;
        target.columnGap = next;
    },
    columnGap(next, _target, node) {
        node.setGap(Yoga.GUTTER_COLUMN, next ?? 0);
    },
    rowGap(next, _target, node) {
        node.setGap(Yoga.GUTTER_ROW, next ?? 0);
    },
};

const DEV = process.env["NODE_ENV"] === "development";

export function createStyleProxy<T extends VStyle = VStyle, U extends RStyle = RStyle>(
    target: T,
    node: YogaNode,
    inheritSet: Set<keyof VStyle>,
    stdout: NodeJS.WriteStream,
    updater: () => void,
) {
    inheritSet.clear();

    const realStyle = createRealStyleProxy<U>(updater, node);
    const virtualStyle = new Proxy<T>(target, {
        get(target: T, prop: keyof VStyle) {
            return target[prop];
        },
        set(target: T, prop: keyof VStyle, newValue: any) {
            if (target[prop] === newValue) return true;

            inheritSet[newValue === "inherit" ? "add" : "delete"](prop);
            const sanitizedValue = neverInherit(newValue, undefined);
            target[prop] = sanitizedValue;

            if (ApplySanitizedStyle[prop]) {
                ApplySanitizedStyle[prop](node, realStyle, sanitizedValue, stdout);
            } else if (DEV) {
                console.warn("Missing virtual style implementation for " + prop);
            }

            return true;
        },
    });

    return { realStyle, virtualStyle };
}

function createRealStyleProxy<T extends RStyle>(updater: () => void, node: YogaNode) {
    return new Proxy<T>({} as T, {
        get(target: T, prop: keyof RStyle) {
            return target[prop];
        },
        set(target: T, prop: keyof RStyle, newValue: any) {
            if (target[prop] !== newValue) {
                target[prop] = newValue;
                ApplyRealStyle[prop]?.(newValue, target, node);
                updater();
            }
            return true;
        },
    });
}

class ExampleDomElement {
    public parentElement: ExampleDomElement | null;
    public children: ExampleDomElement[];

    protected virtualStyle!: VStyle;
    protected realStyle!: RStyle;
    protected inheritStyles: Set<keyof VStyle>;
    protected node: YogaNode;

    constructor() {
        this.node = Yoga.Node.create();
        this.inheritStyles = new Set();
        this.parentElement = null;
        this.children = [];
        this.initStyles();
    }

    protected update() {
        // render
    }

    protected initStyles() {
        const { virtualStyle, realStyle } = createStyleProxy<VStyle, RStyle>(
            {},
            this.node,
            this.inheritStyles,
            process.stdout,
            this.update,
        );
        this.virtualStyle = virtualStyle;
        this.realStyle = realStyle;
    }

    set style(configuration: VStyle) {
        this.initStyles();

        const styles = Object.keys(configuration) as (keyof VStyle)[];
        styles.forEach((style) => {
            this.virtualStyle[style] = configuration[style] as any;
        });

        if (this.parentElement) {
            this.applyInheritedStyles();
        }
    }

    get style() {
        return this.virtualStyle;
    }

    protected applyInheritedStyles() {
        const closestSetParent = (style: keyof VStyle) => {
            let parent = this.parentElement;
            while (
                parent &&
                (parent.style[style] === undefined || parent.style[style] !== "inherit")
            ) {
                parent = parent.parentElement;
            }
            return parent?.style[style] as any;
        };

        for (const style of this.inheritStyles) {
            this.style[style] = closestSetParent(style);
        }

        for (const child of this.children) {
            child.applyInheritedStyles();
        }
    }

    public appendChild(child: ExampleDomElement) {
        child.parentElement = this;
        this.children.push(child);

        if (child.inheritStyles.size) {
            this.applyInheritedStyles();
        }
    }

    public removeChild(child: ExampleDomElement) {
        const idx = this.children.findIndex((arrchild) => arrchild === child);
        if (idx >= 0) {
            this.children.splice(idx, 1);
            child.parentElement = null;
            child.applyInheritedStyles();
        }
    }
}

const foo = new ExampleDomElement();
foo.style = { borderTopColor: "yellow" };
foo.style.borderColor = "white";
