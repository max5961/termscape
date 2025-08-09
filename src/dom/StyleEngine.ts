import { RStyle, TextStyle, VBoxStyle, VStyle } from "./Style.js";

/**
 * `DomElement` has a setter and a getter for its `style` property.  It also
 * has a private `virtualStyle` property which are these classes.  The DomElement
 * setter for style creates a new VirtualStyle.  The DomElement getter for style
 * returns the DomElement's virtualStyle, which has setters for all of the style
 * properties, as well as getters.
 *
 * `DomElement` has getters and setters for its `style` property.  These both route
 * to its `virtualStyle` property, which these classes define.
 * - The getter returns the `VirtualStyle` object which has getters for the
 */

function ApplyGetters<T extends VStyle>(vstyle: T) {
    return new Proxy(vstyle, {
        get(target: T, prop: keyof VStyle | symbol) {
            if (typeof prop === "string" && target[prop] !== undefined) {
                return target[prop];
            }
            return undefined;
        },
    });
}

type WithGetters<T extends VStyle> = ReturnType<typeof ApplyGetters<T>>;

// =============================================================================
// VirtualStyle
// =============================================================================

const REAL_STYLE_ACESSOR = Symbol("REAL_STYLE_ACCESSOR");

export function getRealStyle(style: VirtualStyle) {
    return style[REAL_STYLE_ACESSOR]() as RealStyle;
}

export abstract class VirtualStyle {
    protected abstract realStyle: RealStyle;
    public abstract style: WithGetters<VStyle>;

    constructor() {}

    private [REAL_STYLE_ACESSOR] = () => {
        return this.realStyle;
    };
}

export class VirtualBoxStyle extends VirtualStyle {
    protected realStyle: RealBoxStyle;
    public style: WithGetters<VBoxStyle>;

    constructor(style: VBoxStyle) {
        super();
        this.realStyle = new RealBoxStyle();
        this.style = ApplyGetters(style);
    }
}

export class VirtualTextStyle extends VirtualStyle {
    protected realStyle: RealTextStyle;
    public style: WithGetters<TextStyle>;

    constructor(style: TextStyle = {}) {
        super();
        this.realStyle = new RealTextStyle();
        this.style = ApplyGetters(style);
    }
}

class DomElement {
    protected virtualStyle: { foo: "foo" | "FOO"; bar: "bar" | "BAR" };

    constructor() {
        this.virtualStyle = { foo: "foo", bar: "bar" };
    }

    protected applyDiff(virtualStyle: DomElement["virtualStyle"]) {
        return virtualStyle;
    }

    get style() {
        return this.virtualStyle;
    }

    set style(style: DomElement["virtualStyle"]) {
        this.virtualStyle = this.applyDiff(style);
    }
}

const elem = new DomElement();

// =============================================================================
// RealStyle
// =============================================================================

export abstract class RealStyle {
    protected style: RStyle;

    constructor(vStyle: VStyle = {}) {
        this.style = {};
        this.applyStyleObject(this.style, vStyle);
    }

    protected abstract applyStyleObject(target: RStyle, vStyle: VStyle): void;
}

export class RealBoxStyle extends RealStyle {
    constructor(style: RStyle = {}) {
        super(style);
    }

    protected applyStyleObject(target: RStyle, vStyle: VStyle): void {
        //
    }
}

export class RealTextStyle extends RealStyle {
    constructor(style: RStyle = {}) {
        super(style);
    }

    protected applyStyleObject(target: RStyle, vStyle: VStyle): void {
        //
    }
}
