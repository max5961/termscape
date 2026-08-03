import type { Style } from "../Style.js";
import type { ShadowStyleProxy } from "./ShadowStyleProxy.js";
import type { StyleHandler } from "../../../Types.js";
import { Sanitizers } from "./Sanitizers.js";
import { DomElement } from "../../DomElement.js";
import { StyleReconciler } from "./StyleReconciler.js";

type Vir = Style.All;

export class VirtualStyleProxy {
    private __values: Record<string, any>;
    private __shadow: ShadowStyleProxy;
    private __host: DomElement;
    private __styleHandler: StyleHandler<Style.All> | null;
    private __reconciler: StyleReconciler;

    constructor(host: DomElement) {
        this.__values = {};
        this.__host = host;
        this.__shadow = host._shadow;
        this.__styleHandler = null;
        this.__reconciler = new StyleReconciler(this, {});
    }

    /** @internal */
    public _hasStyleHandler() {
        return !!this.__styleHandler;
    }

    private resolveStylesheet(stylesheet: Style.All | StyleHandler<Style.All>) {
        if (typeof stylesheet === "function") {
            this.__styleHandler = stylesheet;
            return stylesheet(this.__host.getFocusStatus());
        }
        this.__styleHandler = null;
        return stylesheet;
    }

    /** @internal */
    public _setStyle(stylesheet: Style.All | StyleHandler<Style.All>) {
        const styles = this.resolveStylesheet(stylesheet);
        this.__reconciler.reconcile(styles);
    }

    /** @internal */
    public _setDefaults(_defaults: Style.All) {
        //
    }

    private getStdout() {
        return this.__host._metadata.getRoot()?.runtime.stdout ?? process.stdout;
    }

    /**
     * Sets shadow proxy if value has not been set in virtual. Cannot use
     * nullish coalescing operator because (in the future) styles set to null
     * could have different implications than those set to undefined
     *
     * Does not resolve the style
     * */
    private _setShadowIfVirtualUndef(
        key: keyof ShadowStyleProxy,
        nextValue: any,
        overrideKey?: keyof VirtualStyleProxy,
    ) {
        if (this.__values[key] === undefined) {
            if (overrideKey && this.__values[overrideKey] !== undefined) return;

            // @ts-expect-error `key` will not be a read only property in shadow
            this.__shadow[key] = nextValue;
        }
    }

    /**
     * Resolves the style and applies the resolved style to the virtual values
     * and the shadow proxy
     * */
    private _setResolvedStyle(key: keyof VirtualStyleProxy, nextValue: any) {
        const resolved = this.__reconciler.resolveStyle(key, nextValue);
        if (this.__values[key] === resolved) return;

        this.__values[key] = resolved;
        // @ts-expect-error key will not be a read only property in shadow
        this.__shadow[key] = resolved;

        return resolved;
    }

    /**
     * Applies the resolved style to the virtual values
     * */
    private _setResolvedVirtual(key: keyof VirtualStyleProxy, nextValue: any) {
        const resolved = this.__reconciler.resolveStyle(key, nextValue);
        if (this.__values[key] !== resolved) {
            this.__values[key] = resolved;
        }
        return resolved;
    }

    private expandShorthand<T>(v: T | T[]) {
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

    private shorthandIsEqual<T>(a: T | T[], b: T | T[]) {
        if (!Array.isArray(a) || !Array.isArray(b)) {
            return a === b;
        }

        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; ++i) {
            if (a[i] !== b[i]) return false;
        }

        return true;
    }

    get height(): Vir["height"] {
        return this.__values["height"];
    }
    set height(v: Vir["height"]) {
        const resolved = this._setResolvedVirtual("height", v);
        this.__shadow.height = Sanitizers.height(resolved, this.getStdout());
    }

    get width(): Vir["width"] {
        return this.__values["width"];
    }
    set width(v: Vir["width"]) {
        const resolved = this._setResolvedVirtual("width", v);
        this.__shadow.width = Sanitizers.width(resolved, this.getStdout());
    }

    get minHeight(): Vir["minHeight"] {
        return this.__values["minHeight"];
    }
    set minHeight(v: Vir["minHeight"]) {
        const resolved = this._setResolvedVirtual("minHeight", v);
        this.__shadow.minHeight = Sanitizers.minHeight(resolved, this.getStdout());
    }

    get minWidth(): Vir["minWidth"] {
        return this.__values["minWidth"];
    }
    set minWidth(v: Vir["minWidth"]) {
        const resolved = this._setResolvedVirtual("minWidth", v);
        this.__shadow.minWidth = Sanitizers.minWidth(resolved, this.getStdout());
    }

    get margin(): Vir["margin"] {
        return this.__values["margin"];
    }
    set margin(v: Vir["margin"]) {
        const resolved = this.__reconciler.resolveStyle("margin", v);
        if (this.shorthandIsEqual(this.__values["margin"], resolved)) return;

        this.__values["margin"] = resolved;
        const [top, right, bottom, left] = this.expandShorthand(resolved);
        this._setShadowIfVirtualUndef("marginTop", top, "marginY");
        this._setShadowIfVirtualUndef("marginRight", right, "marginX");
        this._setShadowIfVirtualUndef("marginBottom", bottom, "marginY");
        this._setShadowIfVirtualUndef("marginLeft", left, "marginX");
    }

    get marginX(): Vir["marginX"] {
        return this.__values["marginX"];
    }
    set marginX(v: Vir["marginX"]) {
        const resolved = this.__reconciler.resolveStyle("marginX", v);
        if (resolved === this.__values["marginX"]) return;

        this.__values["marginX"] = resolved;
        this._setShadowIfVirtualUndef("marginLeft", resolved);
        this._setShadowIfVirtualUndef("marginRight", resolved);
    }

    get marginY(): Vir["marginY"] {
        return this.__values["marginY"];
    }
    set marginY(v: Vir["marginY"]) {
        const resolved = this.__reconciler.resolveStyle("marginY", v);
        if (resolved === this.__values["marginY"]) return;

        this.__values["marginY"] = resolved;
        this._setShadowIfVirtualUndef("marginTop", resolved);
        this._setShadowIfVirtualUndef("marginBottom", resolved);
    }

    get marginTop(): Vir["marginTop"] {
        return this.__values["marginTop"];
    }
    set marginTop(v: Vir["marginTop"]) {
        this._setResolvedStyle("marginTop", v);
    }

    get marginBottom(): Vir["marginBottom"] {
        return this.__values["marginBottom"];
    }
    set marginBottom(v: Vir["marginBottom"]) {
        this._setResolvedStyle("marginBottom", v);
    }

    get marginLeft(): Vir["marginLeft"] {
        return this.__values["marginLeft"];
    }
    set marginLeft(v: Vir["marginLeft"]) {
        this._setResolvedStyle("marginLeft", v);
    }

    get marginRight(): Vir["marginRight"] {
        return this.__values["marginRight"];
    }
    set marginRight(v: Vir["marginRight"]) {
        this._setResolvedStyle("marginRight", v);
    }

    get padding(): Vir["padding"] {
        return this.__values["padding"];
    }
    set padding(v: Vir["padding"]) {
        const resolved = this.__reconciler.resolveStyle("padding", v);
        if (this.shorthandIsEqual(this.__values["padding"], resolved)) return;

        this.__values["padding"] = resolved;
        const [top, right, bottom, left] = this.expandShorthand(v);
        this._setShadowIfVirtualUndef("paddingTop", top, "paddingY");
        this._setShadowIfVirtualUndef("paddingRight", right, "paddingX");
        this._setShadowIfVirtualUndef("paddingBottom", bottom, "paddingY");
        this._setShadowIfVirtualUndef("paddingLeft", left, "paddingX");
    }

    get paddingX(): Vir["paddingX"] {
        return this.__values["paddingX"];
    }
    set paddingX(v: Vir["paddingX"]) {
        const resolved = this.__reconciler.resolveStyle("paddingX", v);
        if (resolved === this.__values["paddingX"]) return;

        this.__values["paddingX"] = resolved;
        this._setShadowIfVirtualUndef("paddingLeft", resolved);
        this._setShadowIfVirtualUndef("paddingRight", resolved);
    }

    get paddingY(): Vir["paddingY"] {
        return this.__values["paddingY"];
    }
    set paddingY(v: Vir["paddingY"]) {
        const resolved = this.__reconciler.resolveStyle("paddingY", v);
        if (resolved === this.__values["paddingY"]) return;

        this.__values["paddingY"] = v;
        this._setShadowIfVirtualUndef("paddingTop", v);
        this._setShadowIfVirtualUndef("paddingBottom", v);
    }

    get paddingTop(): Vir["paddingTop"] {
        return this.__values["paddingTop"];
    }
    set paddingTop(v: Vir["paddingTop"]) {
        this._setResolvedStyle("paddingTop", v);
    }

    get paddingBottom(): Vir["paddingBottom"] {
        return this.__values["paddingBottom"];
    }
    set paddingBottom(v: Vir["paddingBottom"]) {
        this._setResolvedStyle("paddingBottom", v);
    }

    get paddingLeft(): Vir["paddingLeft"] {
        return this.__values["paddingLeft"];
    }
    set paddingLeft(v: Vir["paddingLeft"]) {
        this._setResolvedStyle("paddingLeft", v);
    }

    get paddingRight(): Vir["paddingRight"] {
        return this.__values["paddingRight"];
    }
    set paddingRight(v: Vir["paddingRight"]) {
        this._setResolvedStyle("paddingRight", v);
    }

    get position(): Vir["position"] {
        return this.__values["position"];
    }
    set position(v: Vir["position"]) {
        this._setResolvedStyle("position", v);
    }

    get display(): Vir["display"] {
        return this.__values["display"];
    }
    set display(v: Vir["display"]) {
        this._setResolvedStyle("display", v);
    }

    get flexGrow(): Vir["flexGrow"] {
        return this.__values["flexGrow"];
    }
    set flexGrow(v: Vir["flexGrow"]) {
        this._setResolvedStyle("flexGrow", v);
    }

    get flexShrink(): Vir["flexShrink"] {
        return this.__values["flexShrink"];
    }
    // ***** COME BACK TO THIS ONE *****
    set flexShrink(v: Vir["flexShrink"]) {
        // flexShrink should always be recalculated
        // if (this.__values["flexShrink"] === v) return;
        this._setResolvedStyle("flexShrink", v);
    }

    get flexDirection(): Vir["flexDirection"] {
        return this.__values["flexDirection"];
    }
    set flexDirection(v: Vir["flexDirection"]) {
        this._setResolvedStyle("flexDirection", v);
    }

    get flexBasis(): Vir["flexBasis"] {
        return this.__values["flexBasis"];
    }
    set flexBasis(v: Vir["flexBasis"]) {
        this._setResolvedStyle("flexBasis", v);
    }

    get flexWrap(): Vir["flexWrap"] {
        return this.__values["flexWrap"];
    }
    set flexWrap(v: Vir["flexWrap"]) {
        this._setResolvedStyle("flexWrap", v);
    }

    get alignItems(): Vir["alignItems"] {
        return this.__values["alignItems"];
    }
    set alignItems(v: Vir["alignItems"]) {
        this._setResolvedStyle("alignItems", v);
    }

    get alignSelf(): Vir["alignSelf"] {
        return this.__values["alignSelf"];
    }
    set alignSelf(v: Vir["alignSelf"]) {
        this._setResolvedStyle("alignSelf", v);
    }

    get justifyContent(): Vir["justifyContent"] {
        return this.__values["justifyContent"];
    }
    set justifyContent(v: Vir["justifyContent"]) {
        if (this.__values["justifyContent"] === v) return;
        this._setResolvedStyle("justifyContent", v);
    }

    get gap(): Vir["gap"] {
        return this.__values["gap"];
    }
    set gap(v: Vir["gap"]) {
        if (this.__values["gap"] === v) return;
        this.__values["gap"] = v;

        this._setShadowIfVirtualUndef("rowGap", v);
        this._setShadowIfVirtualUndef("columnGap", v);
    }

    get columnGap(): Vir["columnGap"] {
        return this.__values["columnGap"];
    }
    set columnGap(v: Vir["columnGap"]) {
        if (this.__values["columnGap"] === v) return;
        this._setResolvedStyle("columnGap", v);
    }

    get rowGap(): Vir["rowGap"] {
        return this.__values["rowGap"];
    }
    set rowGap(v: Vir["rowGap"]) {
        if (this.__values["rowGap"] === v) return;
        this._setResolvedStyle("rowGap", v);
    }

    get zIndex(): Vir["zIndex"] {
        return this.__values["zIndex"];
    }
    set zIndex(v: Vir["zIndex"]) {
        this._setResolvedStyle("zIndex", v);
    }

    get backgroundColor(): Vir["backgroundColor"] {
        return this.__values["backgroundColor"];
    }
    set backgroundColor(v: Vir["backgroundColor"]) {
        if (this.__values["backgroundColor"] === v) return;
        this._setResolvedStyle("backgroundColor", v);
    }

    get backgroundStyle(): Vir["backgroundStyle"] {
        return this.__values["backgroundStyle"];
    }
    set backgroundStyle(v: Vir["backgroundStyle"]) {
        if (this.__values["backgroundStyle"] === v) return;
        this._setResolvedStyle("backgroundStyle", v);
    }

    get backgroundStyleColor(): Vir["backgroundStyleColor"] {
        return this.__values["backgroundStyleColor"];
    }
    set backgroundStyleColor(v: Vir["backgroundStyleColor"]) {
        if (this.__values["backgroundStyleColor"] === v) return;
        this._setResolvedStyle("backgroundStyleColor", v);
    }

    get overflow(): Vir["overflow"] {
        return this.__values["overflow"];
    }
    set overflow(v: Vir["overflow"]) {
        if (this.__values["overflow"] === v) return;
        this.__values["overflow"] = v;

        this._setShadowIfVirtualUndef("overflowX", v);
        this._setShadowIfVirtualUndef("overflowY", v);
    }

    get overflowX(): Vir["overflowX"] {
        return this.__values["overflowX"];
    }
    set overflowX(v: Vir["overflowX"]) {
        if (this.__values["overflowX"] === v) return;
        this._setResolvedStyle("overflowX", v);
    }

    get overflowY(): Vir["overflowY"] {
        return this.__values["overflowY"];
    }
    set overflowY(v: Vir["overflowY"]) {
        if (this.__values["overflowY"] === v) return;
        this._setResolvedStyle("overflowY", v);
    }

    get borderStyle(): Vir["borderStyle"] {
        return this.__values["borderStyle"];
    }
    set borderStyle(v: Vir["borderStyle"]) {
        if (this.__values["borderStyle"] === v) return;
        this.__values["borderStyle"] = v;

        this._setShadowIfVirtualUndef("borderTop", !!v);
        this._setShadowIfVirtualUndef("borderBottom", !!v);
        this._setShadowIfVirtualUndef("borderLeft", !!v);
        this._setShadowIfVirtualUndef("borderRight", !!v);
    }

    get borderTop(): Vir["borderTop"] {
        return this.__values["borderTop"];
    }
    set borderTop(v: Vir["borderTop"]) {
        if (this.__values["borderTop"] === v) return;
        this._setResolvedStyle("borderTop", v);
    }

    get borderBottom(): Vir["borderBottom"] {
        return this.__values["borderBottom"];
    }
    set borderBottom(v: Vir["borderBottom"]) {
        if (this.__values["borderBottom"] === v) return;
        this._setResolvedStyle("borderBottom", v);
    }

    get borderLeft(): Vir["borderLeft"] {
        return this.__values["borderLeft"];
    }
    set borderLeft(v: Vir["borderLeft"]) {
        if (this.__values["borderLeft"] === v) return;
        this._setResolvedStyle("borderLeft", v);
    }

    get borderRight(): Vir["borderRight"] {
        return this.__values["borderRight"];
    }
    set borderRight(v: Vir["borderRight"]) {
        if (this.__values["borderRight"] === v) return;
        this._setResolvedStyle("borderRight", v);
    }

    get borderColor(): Vir["borderColor"] {
        return this.__values["borderColor"];
    }
    set borderColor(v: Vir["borderColor"]) {
        if (this.__values["borderColor"] === v) return;
        this.__values["borderColor"] = v;

        this._setShadowIfVirtualUndef("borderTopColor", v);
        this._setShadowIfVirtualUndef("borderBottomColor", v);
        this._setShadowIfVirtualUndef("borderLeftColor", v);
        this._setShadowIfVirtualUndef("borderRightColor", v);
    }

    get borderTopColor(): Vir["borderTopColor"] {
        return this.__values["borderTopColor"];
    }
    set borderTopColor(v: Vir["borderTopColor"]) {
        if (this.__values["borderTopColor"] === v) return;
        this._setResolvedStyle("borderTopColor", v);
    }

    get borderBottomColor(): Vir["borderBottomColor"] {
        return this.__values["borderBottomColor"];
    }
    set borderBottomColor(v: Vir["borderBottomColor"]) {
        if (this.__values["borderBottomColor"] === v) return;
        this._setResolvedStyle("borderBottomColor", v);
    }

    get borderLeftColor(): Vir["borderLeftColor"] {
        return this.__values["borderLeftColor"];
    }
    set borderLeftColor(v: Vir["borderLeftColor"]) {
        if (this.__values["borderLeftColor"] === v) return;
        this._setResolvedStyle("borderLeftColor", v);
    }

    get borderRightColor(): Vir["borderRightColor"] {
        return this.__values["borderRightColor"];
    }
    set borderRightColor(v: Vir["borderRightColor"]) {
        if (this.__values["borderRightColor"] === v) return;
        this._setResolvedStyle("borderRightColor", v);
    }

    get borderDimColor(): Vir["borderDimColor"] {
        return this.__values["borderDimColor"];
    }
    set borderDimColor(v: Vir["borderDimColor"]) {
        if (this.__values["borderDimColor"] === v) return;
        this.__values["borderDimColor"] = v;

        this._setShadowIfVirtualUndef("borderTopDimColor", v);
        this._setShadowIfVirtualUndef("borderBottomDimColor", v);
        this._setShadowIfVirtualUndef("borderLeftDimColor", v);
        this._setShadowIfVirtualUndef("borderRightDimColor", v);
    }

    get borderTopDimColor(): Vir["borderTopDimColor"] {
        return this.__values["borderTopDimColor"];
    }
    set borderTopDimColor(v: Vir["borderTopDimColor"]) {
        if (this.__values["borderTopDimColor"] === v) return;
        this._setResolvedStyle("borderTopDimColor", v);
    }

    get borderBottomDimColor(): Vir["borderBottomDimColor"] {
        return this.__values["borderBottomDimColor"];
    }
    set borderBottomDimColor(v: Vir["borderBottomDimColor"]) {
        if (this.__values["borderBottomDimColor"] === v) return;
        this._setResolvedStyle("borderBottomDimColor", v);
    }

    get borderLeftDimColor(): Vir["borderLeftDimColor"] {
        return this.__values["borderLeftDimColor"];
    }
    set borderLeftDimColor(v: Vir["borderLeftDimColor"]) {
        if (this.__values["borderLeftDimColor"] === v) return;
        this._setResolvedStyle("borderLeftDimColor", v);
    }

    get borderRightDimColor(): Vir["borderRightDimColor"] {
        return this.__values["borderRightDimColor"];
    }
    set borderRightDimColor(v: Vir["borderRightDimColor"]) {
        if (this.__values["borderRightDimColor"] === v) return;
        this._setResolvedStyle("borderRightDimColor", v);
    }

    get _scrollbarPaddingLeft(): Vir["_scrollbarPaddingLeft"] {
        return this.__values["_scrollbarPaddingLeft"];
    }
    set _scrollbarPaddingLeft(v: Vir["_scrollbarPaddingLeft"]) {
        if (this.__values["_scrollbarPaddingLeft"] === v) return;
        this._setResolvedStyle("_scrollbarBorderLeft", v);
    }

    get _scrollbarPaddingRight(): Vir["_scrollbarPaddingRight"] {
        return this.__values["_scrollbarPaddingRight"];
    }
    set _scrollbarPaddingRight(v: Vir["_scrollbarPaddingRight"]) {
        if (this.__values["_scrollbarPaddingRight"] === v) return;
        this._setResolvedStyle("_scrollbarPaddingRight", v);
    }

    get _scrollbarPaddingTop(): Vir["_scrollbarPaddingTop"] {
        return this.__values["_scrollbarPaddingTop"];
    }
    set _scrollbarPaddingTop(v: Vir["_scrollbarPaddingTop"]) {
        if (this.__values["_scrollbarPaddingTop"] === v) return;
        this._setResolvedStyle("_scrollbarBorderTop", v);
    }

    get _scrollbarPaddingBottom(): Vir["_scrollbarPaddingBottom"] {
        return this.__values["_scrollbarPaddingBottom"];
    }
    set _scrollbarPaddingBottom(v: Vir["_scrollbarPaddingBottom"]) {
        if (this.__values["_scrollbarPaddingBottom"] === v) return;
        this._setResolvedStyle("_scrollbarPaddingBottom", v);
    }

    get _scrollbarBorderLeft(): Vir["_scrollbarBorderLeft"] {
        return this.__values["_scrollbarBorderLeft"];
    }
    set _scrollbarBorderLeft(v: Vir["_scrollbarBorderLeft"]) {
        if (this.__values["_scrollbarBorderLeft"] === v) return;
        this._setResolvedStyle("_scrollbarBorderLeft", v);
    }

    get _scrollbarBorderRight(): Vir["_scrollbarBorderRight"] {
        return this.__values["_scrollbarBorderRight"];
    }
    set _scrollbarBorderRight(v: Vir["_scrollbarBorderRight"]) {
        if (this.__values["_scrollbarBorderRight"] === v) return;
        this._setResolvedStyle("_scrollbarBorderRight", v);
    }

    get _scrollbarBorderTop(): Vir["_scrollbarBorderTop"] {
        return this.__values["_scrollbarBorderTop"];
    }
    set _scrollbarBorderTop(v: Vir["_scrollbarBorderTop"]) {
        if (this.__values["_scrollbarBorderTop"] === v) return;
        this._setResolvedStyle("_scrollbarBorderTop", v);
    }

    get _scrollbarBorderBottom(): Vir["_scrollbarBorderBottom"] {
        return this.__values["_scrollbarBorderBottom"];
    }
    set _scrollbarBorderBottom(v: Vir["_scrollbarBorderBottom"]) {
        if (this.__values["_scrollbarBorderBottom"] === v) return;
        this._setResolvedStyle("_scrollbarBorderBottom", v);
    }

    // ***** TEXT *****

    get color(): Vir["color"] {
        return this.__values["color"];
    }
    set color(v: Vir["color"]) {
        if (this.__values["color"] === v) return;
        this._setResolvedStyle("color", v);
    }

    // backgroundColor overlaps that of regular styles

    get dimColor(): Vir["dimColor"] {
        return this.__values["dimColor"];
    }
    set dimColor(v: Vir["dimColor"]) {
        if (this.__values["dimColor"] === v) return;
        this._setResolvedStyle("dimColor", v);
    }

    get bold(): Vir["bold"] {
        return this.__values["bold"];
    }
    set bold(v: Vir["bold"]) {
        if (this.__values["bold"] === v) return;
        this._setResolvedStyle("bold", v);
    }

    get italic(): Vir["italic"] {
        return this.__values["italic"];
    }
    set italic(v: Vir["italic"]) {
        if (this.__values["italic"] === v) return;
        this._setResolvedStyle("italic", v);
    }

    get underline(): Vir["underline"] {
        return this.__values["underline"];
    }
    set underline(v: Vir["underline"]) {
        if (this.__values["underline"] === v) return;
        this._setResolvedStyle("underline", v);
    }

    get strikethrough(): Vir["strikethrough"] {
        return this.__values["strikethrough"];
    }
    set strikethrough(v: Vir["strikethrough"]) {
        if (this.__values["strikethrough"] === v) return;
        this._setResolvedStyle("strikethrough", v);
    }

    get wrap(): Vir["wrap"] {
        return this.__values["wrap"];
    }
    set wrap(v: Vir["wrap"]) {
        if (this.__values["wrap"] === v) return;
        this._setResolvedStyle("wrap", v);
    }

    get align(): Vir["align"] {
        return this.__values["align"];
    }
    set align(v: Vir["align"]) {
        if (this.__values["align"] === v) return;
        this._setResolvedStyle("align", v);
    }

    get imagePositive(): Vir["imagePositive"] {
        return this.__values["imagePositive"];
    }
    set imagePositive(v: Vir["imagePositive"]) {
        if (this.__values["imagePositive"] === v) return;
        this._setResolvedStyle("imagePositive", v);
    }

    get imageNegative(): Vir["imageNegative"] {
        return this.__values["imageNegative"];
    }
    set imageNegative(v: Vir["imageNegative"]) {
        if (this.__values["imageNegative"] === v) return;
        this._setResolvedStyle("imageNegative", v);
    }

    get fontDefault(): Vir["fontDefault"] {
        return this.__values["fontDefault"];
    }
    set fontDefault(v: Vir["fontDefault"]) {
        if (this.__values["fontDefault"] === v) return;
        this._setResolvedStyle("fontDefault", v);
    }

    get font1(): Vir["font1"] {
        return this.__values["font1"];
    }
    set font1(v: Vir["font1"]) {
        if (this.__values["font1"] === v) return;
        this._setResolvedStyle("font1", v);
    }

    get font2(): Vir["font2"] {
        return this.__values["font2"];
    }
    set font2(v: Vir["font2"]) {
        if (this.__values["font2"] === v) return;
        this._setResolvedStyle("font3", v);
    }

    get font3(): Vir["font3"] {
        return this.__values["font3"];
    }
    set font3(v: Vir["font3"]) {
        if (this.__values["font3"] === v) return;
        this._setResolvedStyle("font3", v);
    }

    get font4(): Vir["font4"] {
        return this.__values["font4"];
    }
    set font4(v: Vir["font4"]) {
        if (this.__values["font4"] === v) return;
        this._setResolvedStyle("font4", v);
    }

    get font5(): Vir["font5"] {
        return this.__values["font5"];
    }
    set font5(v: Vir["font5"]) {
        if (this.__values["font5"] === v) return;
        this._setResolvedStyle("font5", v);
    }

    get font6(): Vir["font6"] {
        return this.__values["font6"];
    }
    set font6(v: Vir["font6"]) {
        if (this.__values["font6"] === v) return;
        this._setResolvedStyle("font6", v);
    }
}
