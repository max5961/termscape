import { NarrowFallbackMap, MiddleFallbackMap } from "./FallbackMap.js";
import type { ShadowStyle } from "./ShadowStyle.js";
import type {
    IMiddleStyle,
    INarrowStyle,
    IShadowStyle,
    IStyle,
    IWideStyle,
} from "./IStyle.js";
import type { RequiredPartial } from "./types.js";

type Setter = 3 | 2 | 1;

export class VirtualStyle implements RequiredPartial<IStyle> {
    private __values: IStyle;
    private __defaults: Readonly<IStyle>;
    private __active: Set<keyof IStyle>;
    private __shadow: IShadowStyle;
    private __setterHistory: Map<keyof INarrowStyle, Setter>;

    constructor(defaults: IStyle, shadow: ShadowStyle) {
        this.__defaults = defaults;
        this.__values = {};
        this.__active = new Set();
        this.__shadow = shadow;
        this.__setterHistory = new Map();

        for (const key in this.__defaults) {
            // @ts-expect-error the key/value correlation is valid
            this[key] = this.__defaults[key];
        }
    }

    private __trackActive(style: keyof IStyle, value: any) {
        if (value === undefined) {
            this.__active.delete(style);
        } else {
            this.__active.add(style);
        }
    }

    private __setNarrow<T extends keyof INarrowStyle>(
        style: T,
        value: INarrowStyle[T],
        setter: Setter = 1,
    ) {
        this.__setterHistory.set(style, setter);
        const resolved = this.__resolveNarrow(style, value, setter);

        // We can only set virtual when the setter is 1, meaning it was set from the style directly
        if (setter === 1) {
            // explicit set to undefined -> use default
            if (value === undefined && this.__defaults[style] !== undefined) {
                this.__values[style] = this.__defaults[style];
                // explicit set to not undefined -> use value (resolveNarrow has a branch just like this that returns early the value)
            } else if (value !== undefined) {
                this.__values[style] = value;
                // value is undefined, so we need to explicitly clean up and undefine it in virtual
            } else {
                this.__values[style] = undefined;
            }
        }

        this.__trackActive(style, this.__values[style]);
        this.__shadow[style] = resolved;
    }

    private __setNarrowFromWide<T extends keyof INarrowStyle>(
        style: T,
        value: INarrowStyle[T],
    ) {
        const prevSetter = this.__setterHistory.get(style);
        if (prevSetter === undefined || prevSetter > 2) {
            this.__setNarrow(style, value, 3);
        }
    }

    private __setNarrowFromMiddle<T extends keyof INarrowStyle>(
        style: T,
        value: INarrowStyle[T],
    ) {
        if (this.__values[style] === undefined) {
            this.__setNarrow(style, value, 2);
        }
    }

    private __setIndependent<T extends keyof IShadowStyle>(
        style: T,
        value: IShadowStyle[T],
    ) {
        const resolved = this.__resolveIndependent(style, value);
        if (this.__values[style] !== resolved) {
            this.__values[style] = resolved;
            this.__shadow[style] = resolved;
        }
    }

    private __resolveNarrow<T extends keyof INarrowStyle>(
        style: T,
        value: INarrowStyle[T],
        setter: Setter,
    ): INarrowStyle[T] {
        // The value is set and is being set directly
        if (value !== undefined && setter === 1) {
            return value;
        }

        if (value === undefined) {
            const dft = this.__defaults[style];
            if (dft !== undefined) return dft;

            const middleFallbackStyle = NarrowFallbackMap[style][2];
            if (middleFallbackStyle && this.__values[middleFallbackStyle]) {
                return this.__values[middleFallbackStyle] as INarrowStyle[T];
            }

            // @ts-expect-error some styles do not have a wide fallback, but we explicitly check for this.
            const wideFallbackStyle = NarrowFallbackMap[style][3] as keyof IWideStyle;
            if (wideFallbackStyle) {
                return this.__values[wideFallbackStyle] as INarrowStyle[T];
            }
            return undefined;
        }

        return value;
    }

    private __resolveIndependent<T extends keyof IShadowStyle>(
        style: T,
        value: IShadowStyle[T],
    ) {
        if (value === undefined) {
            value = this.__defaults[style];
        }
        this.__trackActive(style, value);
        return value;
    }

    private __resolveMiddle<T extends keyof IMiddleStyle>(
        style: T,
        value: IMiddleStyle[T],
    ) {
        if (value === undefined) {
            if (this.__defaults[style] !== undefined) {
                value = this.__defaults[style];
            } else {
                const wideFallbackStyle = MiddleFallbackMap[style];
                if (wideFallbackStyle !== undefined) {
                    value = this.__values[wideFallbackStyle];
                } else {
                    value = undefined;
                }
            }
        }

        this.__trackActive(style, value);
        return value;
    }

    private __resolveWide<T extends keyof IWideStyle>(style: T, value: IWideStyle[T]) {
        if (value === undefined) {
            value = this.__defaults[style];
        }
        this.__trackActive(style, value);
        return value;
    }

    public __setStyle(next: IStyle): void {
        const nextKeys = Object.keys(next) as (keyof IStyle)[];
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

    public __getValues() {
        return this.__values;
    }

    public __getActiveKeys() {
        return [...this.__active.values()];
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
        this.__setIndependent("height", v);
    }

    get width() {
        return this.__values.width;
    }
    set width(v) {
        this.__setIndependent("width", v);
    }

    get minHeight() {
        return this.__values.minHeight;
    }
    set minHeight(v) {
        this.__setIndependent("minHeight", v);
    }

    get minWidth() {
        return this.__values.minWidth;
    }
    set minWidth(v) {
        this.__setIndependent("minWidth", v);
    }

    get margin() {
        return this.__values.margin;
    }
    set margin(v) {
        const resolved = this.__resolveWide("margin", v);
        if (this.__shorthandIsEqual(this.__values.margin, resolved)) return;

        this.__values.margin = resolved;
        const [top, right, bottom, left] = this.__expandShorthand(resolved);

        this.__setNarrowFromWide("marginTop", top);
        this.__setNarrowFromWide("marginRight", right);
        this.__setNarrowFromWide("marginBottom", bottom);
        this.__setNarrowFromWide("marginLeft", left);
    }

    get marginX() {
        return this.__values.marginX;
    }
    set marginX(v) {
        const resolved = this.__resolveMiddle("marginX", v);
        if (this.__values.marginX === resolved) return;

        this.__values.marginX = resolved;
        this.__setNarrowFromMiddle("marginLeft", resolved);
        this.__setNarrowFromMiddle("marginRight", resolved);
    }

    get marginY() {
        return this.__values.marginY;
    }
    set marginY(v) {
        const resolved = this.__resolveMiddle("marginY", v);
        if (this.__values.marginY === resolved) return;

        this.__values.marginY = resolved;
        this.__setNarrowFromMiddle("marginTop", resolved);
        this.__setNarrowFromMiddle("marginBottom", resolved);
    }

    get marginTop() {
        return this.__values.marginTop;
    }
    set marginTop(v) {
        this.__setNarrow("marginTop", v);
    }

    get marginBottom() {
        return this.__values.marginBottom;
    }
    set marginBottom(v) {
        this.__setNarrow("marginBottom", v);
    }

    get marginLeft() {
        return this.__values.marginLeft;
    }
    set marginLeft(v) {
        this.__setNarrow("marginLeft", v);
    }

    get marginRight() {
        return this.__values.marginRight;
    }
    set marginRight(v) {
        this.__setNarrow("marginRight", v);
    }

    get padding() {
        return this.__values.padding;
    }
    set padding(v) {
        const resolved = this.__resolveWide("padding", v);
        if (this.__shorthandIsEqual(this.__values.padding, resolved)) return;

        this.__values.padding = resolved;
        const [top, right, bottom, left] = this.__expandShorthand(resolved);

        this.__setNarrowFromWide("paddingTop", top);
        this.__setNarrowFromWide("paddingRight", right);
        this.__setNarrowFromWide("paddingBottom", bottom);
        this.__setNarrowFromWide("paddingLeft", left);
    }

    get paddingX() {
        return this.__values.paddingX;
    }
    set paddingX(v) {
        const resolved = this.__resolveMiddle("paddingX", v);
        if (this.__values.paddingX === resolved) return;

        this.__values.paddingX = resolved;
        this.__setNarrowFromMiddle("paddingLeft", resolved);
        this.__setNarrowFromMiddle("paddingRight", resolved);
    }

    get paddingY() {
        return this.__values.paddingY;
    }
    set paddingY(v) {
        const resolved = this.__resolveMiddle("paddingY", v);
        if (this.__values.paddingY === resolved) return;

        this.__values.paddingY = resolved;
        this.__setNarrowFromMiddle("paddingTop", resolved);
        this.__setNarrowFromMiddle("paddingBottom", resolved);
    }

    get paddingTop() {
        return this.__values.paddingTop;
    }
    set paddingTop(v) {
        this.__setNarrow("paddingTop", v);
    }

    get paddingBottom() {
        return this.__values.paddingBottom;
    }
    set paddingBottom(v) {
        this.__setNarrow("paddingBottom", v);
    }

    get paddingLeft() {
        return this.__values.paddingLeft;
    }
    set paddingLeft(v) {
        this.__setNarrow("paddingLeft", v);
    }

    get paddingRight() {
        return this.__values.paddingRight;
    }
    set paddingRight(v) {
        this.__setNarrow("paddingRight", v);
    }

    get position() {
        return this.__values.position;
    }
    set position(v) {
        this.__setIndependent("position", v);
    }

    get display() {
        return this.__values.display;
    }
    set display(v) {
        this.__setIndependent("display", v);
    }

    get flexGrow() {
        return this.__values.flexGrow;
    }
    set flexGrow(v) {
        this.__setIndependent("flexGrow", v);
    }

    get flexShrink() {
        return this.__values.flexShrink;
    }
    set flexShrink(v) {
        // `flexShrink` must always be recalculated
        const resolved = this.__resolveIndependent("flexShrink", v);
        this.__values.flexShrink = resolved;
        this.__shadow.flexShrink = resolved;
    }

    get flexDirection() {
        return this.__values.flexDirection;
    }
    set flexDirection(v) {
        this.__setIndependent("flexDirection", v);
    }

    get flexBasis() {
        return this.__values.flexBasis;
    }
    set flexBasis(v) {
        this.__setIndependent("flexBasis", v);
    }

    get flexWrap() {
        return this.__values.flexWrap;
    }
    set flexWrap(v) {
        this.__setIndependent("flexWrap", v);
    }

    get alignItems() {
        return this.__values.alignItems;
    }
    set alignItems(v) {
        this.__setIndependent("alignItems", v);
    }

    get alignSelf() {
        return this.__values.alignSelf;
    }
    set alignSelf(v) {
        this.__setIndependent("alignSelf", v);
    }

    get justifyContent() {
        return this.__values.justifyContent;
    }
    set justifyContent(v) {
        this.__setIndependent("justifyContent", v);
    }

    get gap() {
        return this.__values.gap;
    }
    set gap(v) {
        const resolved = this.__resolveWide("gap", v);
        if (this.__values.gap === resolved) return;

        this.__values.gap = resolved;
        this.__setNarrowFromWide("rowGap", resolved);
        this.__setNarrowFromWide("columnGap", resolved);
    }

    get columnGap() {
        return this.__values.columnGap;
    }
    set columnGap(v) {
        this.__setNarrow("columnGap", v);
    }

    get rowGap() {
        return this.__values.rowGap;
    }
    set rowGap(v) {
        this.__setNarrow("rowGap", v);
    }

    get zIndex() {
        return this.__values.zIndex;
    }
    set zIndex(v) {
        this.__setIndependent("zIndex", v);
    }

    get backgroundColor() {
        return this.__values.backgroundColor;
    }
    set backgroundColor(v) {
        this.__setIndependent("backgroundColor", v);
    }

    get backgroundStyle() {
        return this.__values.backgroundStyle;
    }
    set backgroundStyle(v) {
        this.__setIndependent("backgroundStyle", v);
    }

    get backgroundStyleColor() {
        return this.__values.backgroundStyleColor;
    }
    set backgroundStyleColor(v) {
        this.__setIndependent("backgroundStyleColor", v);
    }

    get overflow() {
        return this.__values.overflow;
    }
    set overflow(v) {
        const resolved = this.__resolveWide("overflow", v);
        if (this.__values.overflow === resolved) return;

        this.__values.overflow = resolved;
        this.__setNarrowFromWide("overflowX", resolved);
        this.__setNarrowFromWide("overflowY", resolved);
    }

    get overflowX() {
        return this.__values.overflowX;
    }
    set overflowX(v) {
        this.__setIndependent("overflowX", v);
    }

    get overflowY() {
        return this.__values.overflowY;
    }
    set overflowY(v) {
        this.__setIndependent("overflowY", v);
    }

    get borderStyle() {
        return this.__values.borderStyle;
    }
    set borderStyle(v) {
        const resolved = this.__resolveWide("borderStyle", v);
        if (this.__values.borderStyle === resolved) return;

        this.__values.borderStyle = resolved;
        this.__shadow.borderStyle = resolved;

        const bool = !!resolved;
        this.__setNarrowFromWide("borderTop", bool);
        this.__setNarrowFromWide("borderBottom", bool);
        this.__setNarrowFromWide("borderLeft", bool);
        this.__setNarrowFromWide("borderRight", bool);
    }

    get borderTop() {
        return this.__values.borderTop;
    }
    set borderTop(v) {
        this.__setNarrow("borderTop", v);
    }

    get borderBottom() {
        return this.__values.borderBottom;
    }
    set borderBottom(v) {
        this.__setNarrow("borderBottom", v);
    }

    get borderLeft() {
        return this.__values.borderLeft;
    }
    set borderLeft(v) {
        this.__setNarrow("borderLeft", v);
    }

    get borderRight() {
        return this.__values.borderRight;
    }
    set borderRight(v) {
        this.__setNarrow("borderRight", v);
    }

    get borderColor() {
        return this.__values.borderColor;
    }
    set borderColor(v) {
        const resolved = this.__resolveWide("borderColor", v);
        if (this.__values.borderColor === resolved) return;

        this.__values.borderColor = resolved;
        this.__setNarrowFromWide("borderTopColor", resolved);
        this.__setNarrowFromWide("borderBottomColor", resolved);
        this.__setNarrowFromWide("borderLeftColor", resolved);
        this.__setNarrowFromWide("borderRightColor", resolved);
    }

    get borderTopColor() {
        return this.__values.borderTopColor;
    }
    set borderTopColor(v) {
        this.__setNarrow("borderTopColor", v);
    }

    get borderBottomColor() {
        return this.__values.borderBottomColor;
    }
    set borderBottomColor(v) {
        this.__setNarrow("borderBottomColor", v);
    }

    get borderLeftColor() {
        return this.__values.borderLeftColor;
    }
    set borderLeftColor(v) {
        this.__setNarrow("borderLeftColor", v);
    }

    get borderRightColor() {
        return this.__values.borderRightColor;
    }
    set borderRightColor(v) {
        this.__setNarrow("borderRightColor", v);
    }

    get borderDimColor() {
        return this.__values.borderDimColor;
    }
    set borderDimColor(v) {
        const resolved = this.__resolveWide("borderDimColor", v);
        if (this.__values.borderDimColor === resolved) return;

        this.__values.borderDimColor = resolved;
        this.__setNarrowFromWide("borderTopDimColor", resolved);
        this.__setNarrowFromWide("borderBottomDimColor", resolved);
        this.__setNarrowFromWide("borderLeftDimColor", resolved);
        this.__setNarrowFromWide("borderRightDimColor", resolved);
    }

    get borderTopDimColor() {
        return this.__values.borderTopDimColor;
    }
    set borderTopDimColor(v) {
        this.__setNarrow("borderTopDimColor", v);
    }

    get borderBottomDimColor() {
        return this.__values.borderBottomDimColor;
    }
    set borderBottomDimColor(v) {
        this.__setNarrow("borderBottomDimColor", v);
    }

    get borderLeftDimColor() {
        return this.__values.borderLeftDimColor;
    }
    set borderLeftDimColor(v) {
        this.__setNarrow("borderLeftDimColor", v);
    }

    get borderRightDimColor() {
        return this.__values.borderRightDimColor;
    }
    set borderRightDimColor(v) {
        this.__setNarrow("borderRightDimColor", v);
    }

    get color() {
        return this.__values.color;
    }
    set color(v) {
        this.__setIndependent("color", v);
    }
    //
    // backgroundColor overlaps that of regular styles

    get dimColor() {
        return this.__values.dimColor;
    }
    set dimColor(v) {
        this.__setIndependent("dimColor", v);
    }

    get bold() {
        return this.__values.bold;
    }
    set bold(v) {
        this.__setIndependent("bold", v);
    }

    get italic() {
        return this.__values.italic;
    }
    set italic(v) {
        this.__setIndependent("italic", v);
    }

    get underline() {
        return this.__values.underline;
    }
    set underline(v) {
        this.__setIndependent("underline", v);
    }

    get strikethrough() {
        return this.__values.strikethrough;
    }
    set strikethrough(v) {
        this.__setIndependent("strikethrough", v);
    }

    get wrap() {
        return this.__values.wrap;
    }
    set wrap(v) {
        this.__setIndependent("wrap", v);
    }

    get align() {
        return this.__values.align;
    }
    set align(v) {
        this.__setIndependent("align", v);
    }

    get imagePositive() {
        return this.__values.imagePositive;
    }
    set imagePositive(v) {
        this.__setIndependent("imagePositive", v);
    }

    get imageNegative() {
        return this.__values.imageNegative;
    }
    set imageNegative(v) {
        this.__setIndependent("imageNegative", v);
    }

    get fontDefault() {
        return this.__values.fontDefault;
    }
    set fontDefault(v) {
        this.__setIndependent("fontDefault", v);
    }

    get font1() {
        return this.__values.font1;
    }
    set font1(v) {
        this.__setIndependent("font1", v);
    }

    get font2() {
        return this.__values.font2;
    }
    set font2(v) {
        this.__setIndependent("font2", v);
    }

    get font3() {
        return this.__values.font3;
    }
    set font3(v) {
        this.__setIndependent("font3", v);
    }

    get font4() {
        return this.__values.font4;
    }
    set font4(v) {
        this.__setIndependent("font4", v);
    }

    get font5() {
        return this.__values.font5;
    }
    set font5(v) {
        this.__setIndependent("font5", v);
    }

    get font6() {
        return this.__values.font6;
    }
    set font6(v) {
        this.__setIndependent("font6", v);
    }
}
