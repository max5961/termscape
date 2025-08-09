import Yoga from "yoga-wasm-web/auto";
import { YogaNode } from "../types.js";
import { RStyle, VStyle } from "./Style.js";

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

const AppleSanitizedStyle: {
    [P in keyof VStyle]: (
        node: YogaNode,
        realStyle: ReturnType<typeof createRealStyleProxy>,
        newVal: VStyle[P],
    ) => void;
} = {
    borderColor(node, realStyle, newVal) {
        // Agnostic as to what the border<Edge>Color is here
        const sanitizedVal = neverInherit(newVal, undefined);
        // realStyle.borderColor is a setter
        realStyle.borderColor = sanitizedVal;
    },
};

/** Handles styles that should be grouped together. */
const ApplyRealStyle: {
    [P in keyof RStyle]: (
        next: RStyle[P],
        target: ReturnType<typeof createRealStyleProxy>,
        node: YogaNode,
    ) => void;
} = {
    borderColor(next, target) {
        // Now we care about the border<Edge>Color
        // Since target is a setter, these will be safely applied.
        target.borderTopColor = neverUndef(target.borderTopColor, next);
        target.borderBottomColor = neverUndef(target.borderBottomColor, next);
        target.borderRightColor = neverUndef(target.borderRightColor, next);
        target.borderLeftColor = neverUndef(target.borderLeftColor, next);
    },

    // =========================================================================
    // MARGIN
    // =========================================================================
    margin(next, target) {
        target.marginTop = neverUndef(target.marginTop, next);
        target.marginBottom = neverUndef(target.marginBottom, next);
        target.marginRight = neverUndef(target.marginRight, next);
        target.marginLeft = neverUndef(target.marginLeft, next);
    },
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
    padding(next, target) {
        target.paddingTop = neverUndef(target.paddingTop, next);
        target.paddingBottom = neverUndef(target.paddingBottom, next);
        target.paddingRight = neverUndef(target.paddingRight, next);
        target.paddingLeft = neverUndef(target.paddingLeft, next);
    },
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
};

const DEV = process.env.NODE_ENV === "development";

export function createStyleProxy<T extends VStyle = VStyle, U extends RStyle = RStyle>(
    target: T,
    node: YogaNode,
    inheritSet: Set<keyof VStyle>,
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
            target[prop] = newValue;

            if (AppleSanitizedStyle[prop]) {
                AppleSanitizedStyle[prop](node, realStyle, newValue);
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
