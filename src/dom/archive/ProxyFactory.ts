import Yoga from "yoga-wasm-web/auto";
import { YogaNode } from "../../types.js";
import { MinusInherit, RStyle, VStyle } from "../../style/Style.js";

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
    });
};

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

            // if (ApplySanitizedStyle[prop]) {
            //     ApplySanitizedStyle[prop](node, realStyle, sanitizedValue, stdout);
            // } else if (DEV) {
            //     console.warn("Missing virtual style implementation for " + prop);
            // }

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
                // ApplyRealStyle[prop]?.(newValue, target, node);
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
