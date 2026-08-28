import type { ShadowStyle } from "./ShadowStyle.js";
import type { IShadowStyle, IStyle, Style } from "./Style.js";

export class VirtualStyle implements IStyle {
    private __values: Style.All;
    private __defaults: Readonly<Style.All>;
    private __active: Set<keyof Style.All>;
    private __shadow: ShadowStyle;

    constructor(defaults: Style.All, shadow: ShadowStyle) {
        this.__defaults = defaults;
        this.__values = {};
        this.__active = new Set();
        this.__shadow = shadow;

        for (const key in this.__defaults) {
            // @ts-expect-error the key/value correlation is valid
            this[key] = this.__defaults[key];
        }
    }

    // prettier-ignore
    private static FallBackMap: { [_ in keyof IStyle]: (keyof IStyle)[] } = {
        marginTop:     ["marginY", "margin"],
        marginBottom:  ["marginY", "margin"],
        marginLeft:    ["marginX", "margin"],
        marginRight:   ["marginX", "margin"],
        marginX:       ["margin"],
        marginY:       ["margin"],
        paddingTop:    ["paddingY", "padding"],
        paddingBottom: ["paddingY", "padding"],
        paddingLeft:   ["paddingX", "padding"],
        paddingRight:  ["paddingX", "padding"],
        paddingX:      ["padding"],
        paddingY:      ["padding"],
    } as const;

    public __setStyle(next: Style.All): void {
        const nextKeys = Object.keys(next) as (keyof Style.All)[];
        const active = this.__getActiveKeys();

        for (const k of active) {
            // @ts-expect-error the key/value correlation is valid
            this[k] = next[k];

            if (next[k] === undefined) {
                if (k in this.__defaults) {
                    // @ts-expect-error the key/value correlation is valid
                    this[k] = this.__defaults[k];
                } else {
                    this.__active.delete(k);
                }
            }
        }

        for (const k of nextKeys) {
            if (this.__active.has(k)) continue; // taken care of in prev block
            // @ts-expect-error the key/value correlation is valid
            this[k] = next[k];
            if (next[k] !== undefined) {
                this.__active.add(k);
            }
        }
    }

    public __getActiveKeys() {
        return [...this.__active.values()];
    }

    /**
     * Does not set either virtual or shadow. Only resolves the value and updates
     * the active set.
     * */
    private __resolveValue<T extends keyof Style.All>(key: T, value: Style.All[T]) {
        const resolved = value === undefined ? this.__defaults[key] : value;
        if (resolved === undefined) {
            this.__active.delete(key);
        } else {
            this.__active.add(key);
        }
        return resolved;
    }

    private __setNarrow<T extends keyof IShadowStyle>(
        narrow: T,
        value: IShadowStyle[T],
        wide: keyof Style.All,
    ) {
        const resolved = this.__resolveValue(narrow, value);
        this.__values[narrow] = resolved;
        if (resolved === undefined) {
            // @ts-expect-error just doing this to pass unit tests but it will fail future unit test cases
            this.__shadow[narrow] = this.__values[wide];
        }
    }

    /**
     * Set in virtual.  Value falls through to shadow.
     * */
    private __setShadowAndVirtual<T extends keyof IShadowStyle>(
        key: T,
        value: IShadowStyle[T],
    ) {
        const resolved = this.__resolveValue(key, value);
        if (this.__values[key] !== resolved) {
            this.__values[key] = resolved;
            // @ts-ignore
            this.__shadow[key] = resolved;
        }
    }

    /**
     * Does not set in virtual.  Value falls through to shadow only if the virtual
     * style and its override are undefined.
     * */
    private __setShadowIfVirtualUndef<T extends keyof IShadowStyle>(
        key: T,
        value: IShadowStyle[T],
        virtualOverride?: keyof Style.All,
    ) {
        if (this.__values[key] !== undefined) return;
        if (virtualOverride && this.__values[virtualOverride] !== undefined) return;

        // @ts-expect-error this will have a setter in shadow
        this.__shadow[key] = value;
    }

    private __shorthandIsEqual<T>(a: T | T[], b: T | T[]) {
        if (!Array.isArray(a) || !Array.isArray(b)) {
            return a === b;
        }

        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; ++i) {
            if (a[i] !== b[i]) return false;
        }

        return true;
    }

    private __expandShorthand<T>(v: T | T[]) {
        let top: T;
        let right: T;
        let bottom: T;
        let left: T;

        if (!Array.isArray(v)) {
            top = right = bottom = left = v;
        } else {
            [top, right, bottom, left] = v;
            right ??= top;
            bottom ??= top;
            left ??= right;
        }
        return [top, right, bottom, left];
    }

    get height() {
        return this.__values.height;
    }
    set height(v) {
        this.__setShadowAndVirtual("height", v);
    }

    get width() {
        return this.__values.width;
    }
    set width(v) {
        this.__setShadowAndVirtual("width", v);
    }

    get minHeight() {
        return this.__values.minHeight;
    }
    set minHeight(v) {
        this.__setShadowAndVirtual("minHeight", v);
    }

    get minWidth() {
        return this.__values.minWidth;
    }
    set minWidth(v) {
        this.__setShadowAndVirtual("minWidth", v);
    }

    get margin() {
        return this.__values.margin;
    }
    set margin(v) {
        const resolved = this.__resolveValue("margin", v);
        if (this.__shorthandIsEqual(this.__values.margin, resolved)) return;

        this.__values.margin = resolved;
        const [top, right, bottom, left] = this.__expandShorthand(resolved);

        this.__setShadowIfVirtualUndef("marginTop", top, "marginY");
        this.__setShadowIfVirtualUndef("marginRight", right, "marginX");
        this.__setShadowIfVirtualUndef("marginBottom", bottom, "marginY");
        this.__setShadowIfVirtualUndef("marginLeft", left, "marginX");
    }

    get marginX() {
        return this.__values.marginX;
    }
    set marginX(v) {
        const resolved = this.__resolveValue("marginX", v);
        if (this.__values.marginX === resolved) return;

        this.__values.marginX = resolved;
        this.__setShadowIfVirtualUndef("marginLeft", resolved);
        this.__setShadowIfVirtualUndef("marginRight", resolved);
    }

    get marginY() {
        return this.__values.marginY;
    }
    set marginY(v) {
        const resolved = this.__resolveValue("marginY", v);
        if (this.__values.marginY === resolved) return;

        this.__values.marginY = resolved;
        this.__setShadowIfVirtualUndef("marginTop", resolved);
        this.__setShadowIfVirtualUndef("marginBottom", resolved);
    }

    get marginTop() {
        return this.__values.marginTop;
    }
    set marginTop(v) {
        // resolve narrow
        const resolved = this.__resolveValue("marginTop", v);

        // if narrow undefined
        if (resolved === undefined) {
            // fallback to value produced from wider parent and set to virtual and shadow
            const margin = this.__resolveValue("margin", this.__values.margin);
            const [top] = this.__expandShorthand(margin);
            this.__values.marginTop = top;
            this.__shadow.marginTop = top;
        } else {
            // otherwise set narrow shadow and virtual
            this.__values.marginTop = resolved;
            this.__shadow.marginTop = resolved;
        }
    }

    get marginBottom() {
        return this.__values.marginBottom;
    }
    set marginBottom(v) {
        // this.__setShadowAndVirtual("marginBottom", v);
        this.__setNarrow("marginBottom", v, "margin");
    }

    get marginLeft() {
        return this.__values.marginLeft;
    }
    set marginLeft(v) {
        // this.__setShadowAndVirtual("marginLeft", v);
        this.__setNarrow("marginLeft", v, "margin");
    }

    get marginRight() {
        return this.__values.marginRight;
    }
    set marginRight(v) {
        // this.__setShadowAndVirtual("marginRight", v);
        this.__setNarrow("marginRight", v, "margin");
    }

    get padding() {
        return this.__values.padding;
    }
    set padding(v) {
        const resolved = this.__resolveValue("padding", v);
        if (this.__shorthandIsEqual(this.__values.padding, resolved)) return;

        this.__values.padding = resolved;
        const [top, right, bottom, left] = this.__expandShorthand(resolved);

        this.__setShadowIfVirtualUndef("paddingTop", top, "paddingY");
        this.__setShadowIfVirtualUndef("paddingRight", right, "paddingX");
        this.__setShadowIfVirtualUndef("paddingBottom", bottom, "paddingY");
        this.__setShadowIfVirtualUndef("paddingLeft", left, "paddingX");
    }

    get paddingX() {
        return this.__values.paddingX;
    }
    set paddingX(v) {
        const resolved = this.__resolveValue("paddingX", v);
        if (this.__values.paddingX === resolved) return;

        this.__values.paddingX = resolved;
        this.__setShadowIfVirtualUndef("paddingLeft", resolved);
        this.__setShadowIfVirtualUndef("paddingRight", resolved);
    }

    get paddingY() {
        return this.__values.paddingY;
    }
    set paddingY(v) {
        const resolved = this.__resolveValue("paddingY", v);
        if (this.__values.paddingY === resolved) return;

        this.__values.paddingY = resolved;
        this.__setShadowIfVirtualUndef("paddingTop", resolved);
        this.__setShadowIfVirtualUndef("paddingBottom", resolved);
    }

    get paddingTop() {
        return this.__values.paddingTop;
    }
    set paddingTop(v) {
        this.__setShadowAndVirtual("paddingTop", v);
    }

    get paddingBottom() {
        return this.__values.paddingBottom;
    }
    set paddingBottom(v) {
        this.__setShadowAndVirtual("paddingBottom", v);
    }

    get paddingLeft() {
        return this.__values.paddingLeft;
    }
    set paddingLeft(v) {
        this.__setShadowAndVirtual("paddingLeft", v);
    }

    get paddingRight() {
        return this.__values.paddingRight;
    }
    set paddingRight(v) {
        this.__setShadowAndVirtual("paddingRight", v);
    }

    get position() {
        return this.__values.position;
    }
    set position(v) {
        this.__setShadowAndVirtual("position", v);
    }

    get display() {
        return this.__values.display;
    }
    set display(v) {
        this.__setShadowAndVirtual("display", v);
    }

    get flexGrow() {
        return this.__values.flexGrow;
    }
    set flexGrow(v) {
        this.__setShadowAndVirtual("flexGrow", v);
    }

    get flexShrink() {
        return this.__values.flexShrink;
    }
    set flexShrink(v) {
        // `flexShrink` must always be recalculated
        const resolved = this.__resolveValue("flexShrink", v);
        this.__values.flexShrink = resolved;
        this.__shadow.flexShrink = resolved;
    }

    get flexDirection() {
        return this.__values.flexDirection;
    }
    set flexDirection(v) {
        this.__setShadowAndVirtual("flexDirection", v);
    }

    get flexBasis() {
        return this.__values.flexBasis;
    }
    set flexBasis(v) {
        this.__setShadowAndVirtual("flexBasis", v);
    }

    get flexWrap() {
        return this.__values.flexWrap;
    }
    set flexWrap(v) {
        this.__setShadowAndVirtual("flexWrap", v);
    }

    get alignItems() {
        return this.__values.alignItems;
    }
    set alignItems(v) {
        this.__setShadowAndVirtual("alignItems", v);
    }

    get alignSelf() {
        return this.__values.alignSelf;
    }
    set alignSelf(v) {
        this.__setShadowAndVirtual("alignSelf", v);
    }

    get justifyContent() {
        return this.__values.justifyContent;
    }
    set justifyContent(v) {
        this.__setShadowAndVirtual("justifyContent", v);
    }

    get gap() {
        return this.__values.gap;
    }
    set gap(v) {
        const resolved = this.__resolveValue("gap", v);
        if (this.__values.gap === resolved) return;

        this.__values.gap = resolved;
        this.__setShadowIfVirtualUndef("rowGap", resolved);
        this.__setShadowIfVirtualUndef("columnGap", resolved);
    }

    get columnGap() {
        return this.__values.columnGap;
    }
    set columnGap(v) {
        this.__setShadowAndVirtual("columnGap", v);
    }

    get rowGap() {
        return this.__values.rowGap;
    }
    set rowGap(v) {
        this.__setShadowAndVirtual("rowGap", v);
    }

    get zIndex() {
        return this.__values.zIndex;
    }
    set zIndex(v) {
        this.__setShadowAndVirtual("zIndex", v);
    }

    get backgroundColor() {
        return this.__values.backgroundColor;
    }
    set backgroundColor(v) {
        this.__setShadowAndVirtual("backgroundColor", v);
    }

    get backgroundStyle() {
        return this.__values.backgroundStyle;
    }
    set backgroundStyle(v) {
        this.__setShadowAndVirtual("backgroundStyle", v);
    }

    get backgroundStyleColor() {
        return this.__values.backgroundStyleColor;
    }
    set backgroundStyleColor(v) {
        this.__setShadowAndVirtual("backgroundStyleColor", v);
    }

    get overflow() {
        return this.__values.overflow;
    }
    set overflow(v) {
        const resolved = this.__resolveValue("overflow", v);
        if (this.__values.overflow === resolved) return;

        this.__values.overflow = resolved;
        this.__setShadowIfVirtualUndef("overflowX", resolved);
        this.__setShadowIfVirtualUndef("overflowY", resolved);
    }

    get overflowX() {
        return this.__values.overflowX;
    }
    set overflowX(v) {
        this.__setShadowAndVirtual("overflowX", v);
    }

    get overflowY() {
        return this.__values.overflowY;
    }
    set overflowY(v) {
        this.__setShadowAndVirtual("overflowY", v);
    }

    get borderStyle() {
        return this.__values.borderStyle;
    }
    set borderStyle(v) {
        const resolved = this.__resolveValue("borderStyle", v);
        if (this.__values.borderStyle === resolved) return;

        this.__values.borderStyle = resolved;
        this.__shadow.borderStyle = resolved;

        const bool = !!resolved;
        this.__setShadowIfVirtualUndef("borderTop", bool);
        this.__setShadowIfVirtualUndef("borderBottom", bool);
        this.__setShadowIfVirtualUndef("borderLeft", bool);
        this.__setShadowIfVirtualUndef("borderRight", bool);
    }

    get borderTop() {
        return this.__values.borderTop;
    }
    set borderTop(v) {
        this.__setShadowAndVirtual("borderTop", v);
    }

    get borderBottom() {
        return this.__values.borderBottom;
    }
    set borderBottom(v) {
        this.__setShadowAndVirtual("borderBottom", v);
    }

    get borderLeft() {
        return this.__values.borderLeft;
    }
    set borderLeft(v) {
        this.__setShadowAndVirtual("borderLeft", v);
    }

    get borderRight() {
        return this.__values.borderRight;
    }
    set borderRight(v) {
        this.__setShadowAndVirtual("borderRight", v);
    }

    get borderColor() {
        return this.__values.borderColor;
    }
    set borderColor(v) {
        const resolved = this.__resolveValue("borderColor", v);
        if (this.__values.borderColor === resolved) return;

        this.__values.borderColor = resolved;
        this.__setShadowIfVirtualUndef("borderTopColor", resolved);
        this.__setShadowIfVirtualUndef("borderBottomColor", resolved);
        this.__setShadowIfVirtualUndef("borderLeftColor", resolved);
        this.__setShadowIfVirtualUndef("borderRightColor", resolved);
    }

    get borderTopColor() {
        return this.__values.borderTopColor;
    }
    set borderTopColor(v) {
        this.__setShadowAndVirtual("borderTopColor", v);
    }

    get borderBottomColor() {
        return this.__values.borderBottomColor;
    }
    set borderBottomColor(v) {
        this.__setShadowAndVirtual("borderBottomColor", v);
    }

    get borderLeftColor() {
        return this.__values.borderLeftColor;
    }
    set borderLeftColor(v) {
        this.__setShadowAndVirtual("borderLeftColor", v);
    }

    get borderRightColor() {
        return this.__values.borderRightColor;
    }
    set borderRightColor(v) {
        this.__setShadowAndVirtual("borderRightColor", v);
    }

    get borderDimColor() {
        return this.__values.borderDimColor;
    }
    set borderDimColor(v) {
        const resolved = this.__resolveValue("borderDimColor", v);
        if (this.__values.borderDimColor === resolved) return;

        this.__values.borderDimColor = resolved;
        this.__setShadowIfVirtualUndef("borderTopDimColor", resolved);
        this.__setShadowIfVirtualUndef("borderBottomDimColor", resolved);
        this.__setShadowIfVirtualUndef("borderLeftDimColor", resolved);
        this.__setShadowIfVirtualUndef("borderRightDimColor", resolved);
    }

    get borderTopDimColor() {
        return this.__values.borderTopDimColor;
    }
    set borderTopDimColor(v) {
        this.__setShadowAndVirtual("borderTopDimColor", v);
    }

    get borderBottomDimColor() {
        return this.__values.borderBottomDimColor;
    }
    set borderBottomDimColor(v) {
        this.__setShadowAndVirtual("borderBottomDimColor", v);
    }

    get borderLeftDimColor() {
        return this.__values.borderLeftDimColor;
    }
    set borderLeftDimColor(v) {
        this.__setShadowAndVirtual("borderLeftDimColor", v);
    }

    get borderRightDimColor() {
        return this.__values.borderRightDimColor;
    }
    set borderRightDimColor(v) {
        this.__setShadowAndVirtual("borderRightDimColor", v);
    }

    get color() {
        return this.__values.color;
    }
    set color(v) {
        this.__setShadowAndVirtual("color", v);
    }
    //
    // backgroundColor overlaps that of regular styles

    get dimColor() {
        return this.__values.dimColor;
    }
    set dimColor(v) {
        this.__setShadowAndVirtual("dimColor", v);
    }

    get bold() {
        return this.__values.bold;
    }
    set bold(v) {
        this.__setShadowAndVirtual("bold", v);
    }

    get italic() {
        return this.__values.italic;
    }
    set italic(v) {
        this.__setShadowAndVirtual("italic", v);
    }

    get underline() {
        return this.__values.underline;
    }
    set underline(v) {
        this.__setShadowAndVirtual("underline", v);
    }

    get strikethrough() {
        return this.__values.strikethrough;
    }
    set strikethrough(v) {
        this.__setShadowAndVirtual("strikethrough", v);
    }

    get wrap() {
        return this.__values.wrap;
    }
    set wrap(v) {
        this.__setShadowAndVirtual("wrap", v);
    }

    get align() {
        return this.__values.align;
    }
    set align(v) {
        this.__setShadowAndVirtual("align", v);
    }

    get imagePositive() {
        return this.__values.imagePositive;
    }
    set imagePositive(v) {
        this.__setShadowAndVirtual("imagePositive", v);
    }

    get imageNegative() {
        return this.__values.imageNegative;
    }
    set imageNegative(v) {
        this.__setShadowAndVirtual("imageNegative", v);
    }

    get fontDefault() {
        return this.__values.fontDefault;
    }
    set fontDefault(v) {
        this.__setShadowAndVirtual("fontDefault", v);
    }

    get font1() {
        return this.__values.font1;
    }
    set font1(v) {
        this.__setShadowAndVirtual("font1", v);
    }

    get font2() {
        return this.__values.font2;
    }
    set font2(v) {
        this.__setShadowAndVirtual("font2", v);
    }

    get font3() {
        return this.__values.font3;
    }
    set font3(v) {
        this.__setShadowAndVirtual("font3", v);
    }

    get font4() {
        return this.__values.font4;
    }
    set font4(v) {
        this.__setShadowAndVirtual("font4", v);
    }

    get font5() {
        return this.__values.font5;
    }
    set font5(v) {
        this.__setShadowAndVirtual("font5", v);
    }

    get font6() {
        return this.__values.font6;
    }
    set font6(v) {
        this.__setShadowAndVirtual("font6", v);
    }
}
