import type { Style } from "../Style.js";
import type { ShadowStyleProxy } from "./ShadowStyleProxy.js";
import { decodeShorthand } from "../../util/decodeShorthand.js";
import type { YogaNode } from "../../../Types.js";
import { Sanitizers } from "./Sanitizers.js";
import { DomElement } from "../../DomElement.js";

type Vir = Style.All;

export class VirtualStyleProxy {
    private __values: Record<string, any>;
    private __shadow: ShadowStyleProxy;
    private __metadata: DomElement["_metadata"];
    private __node: YogaNode;

    constructor(
        shadow: ShadowStyleProxy,
        metadata: DomElement["_metadata"],
        node: YogaNode,
    ) {
        this.__values = {};
        this.__shadow = shadow;
        this.__metadata = metadata;
        this.__node = node;
    }

    /** @internal */
    public __setDefaults(_defaults: Style.All) {
        //
    }

    private getStdout() {
        return this.__metadata.getRoot()?.runtime.stdout ?? process.stdout;
    }

    /**
     * Sets shadow proxy if value has not been set in virtual. Cannot use
     * nullish coalescing operator because (in the future) styles set to null
     * could have different implications than those set to undefined
     * */
    private _setShadowIfVirtualUndef(key: keyof ShadowStyleProxy, nextValue: any) {
        if (this.__values[key] === undefined) {
            this.__shadow[key] = nextValue;
        }
    }

    /**
     * Sets shadow proxy and values in virtual
     * */
    private _setBoth(key: keyof ShadowStyleProxy, nextValue: any) {
        this.__values[key] = nextValue;
        this.__shadow[key] = nextValue;
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
        this.__values["height"] = v;
        this.__shadow["height"] = Sanitizers.height(v, this.getStdout());
    }

    get width(): Vir["width"] {
        return this.__values["width"];
    }
    set width(v: Vir["width"]) {
        this.__values["width"] = v;
        this.__shadow["width"] = Sanitizers.width(v, this.getStdout());
    }

    get minHeight(): Vir["minHeight"] {
        return this.__values["minHeight"];
    }
    set minHeight(v: Vir["minHeight"]) {
        this.__values["minHeight"] = v;
        this.__shadow["minHeight"] = Sanitizers.minHeight(v, this.getStdout());
    }

    get minWidth(): Vir["minWidth"] {
        return this.__values["minWidth"];
    }
    set minWidth(v: Vir["minWidth"]) {
        this.__values["minWidth"] = v;
        this.__shadow["minWidth"] = Sanitizers.minHeight(v, this.getStdout());
    }

    get margin(): Vir["margin"] {
        return this.__values["margin"];
    }
    set margin(v: Vir["margin"]) {
        if (this.shorthandIsEqual(this.__values["margin"], v)) return;

        this.__values["margin"] = v;

        const [top, right, bottom, left] = this.expandShorthand(v);
        this._setShadowIfVirtualUndef("marginTop", top);
        this._setShadowIfVirtualUndef("marginRight", right);
        this._setShadowIfVirtualUndef("marginBottom", bottom);
        this._setShadowIfVirtualUndef("marginLeft", left);
    }

    get marginX(): Vir["marginX"] {
        return this.__values["marginX"];
    }
    set marginX(v: Vir["marginX"]) {
        if (this.__values["marginX"] === v) return;
        this.__values["marginX"] = v;

        this._setShadowIfVirtualUndef("marginLeft", v);
        this._setShadowIfVirtualUndef("marginRight", v);
    }

    get marginY(): Vir["marginY"] {
        return this.__values["marginY"];
    }
    set marginY(v: Vir["marginY"]) {
        if (this.__values["marginY"] === v) return;
        this.__values["marginY"] = v;

        this._setShadowIfVirtualUndef("marginTop", v);
        this._setShadowIfVirtualUndef("marginBottom", v);
    }

    get marginTop(): Vir["marginTop"] {
        return this.__values["marginTop"];
    }
    set marginTop(v: Vir["marginTop"]) {
        if (this.__values["marginTop"] === v) return;

        this._setBoth("marginTop", v);
    }

    get marginBottom(): Vir["marginBottom"] {
        return this.__values["marginBottom"];
    }
    set marginBottom(v: Vir["marginBottom"]) {
        if (this.__values["marginBottom"] === v) return;
        this._setBoth("marginBottom", v);
    }

    get marginLeft(): Vir["marginLeft"] {
        return this.__values["marginLeft"];
    }
    set marginLeft(v: Vir["marginLeft"]) {
        if (this.__values["marginLeft"] === v) return;
        this._setBoth("marginLeft", v);
    }

    get marginRight(): Vir["marginRight"] {
        return this.__values["marginRight"];
    }
    set marginRight(v: Vir["marginRight"]) {
        if (this.__values["marginRight"] === v) return;
        this._setBoth("marginRight", v);
    }

    get padding(): Vir["padding"] {
        return this.__values["padding"];
    }
    set padding(v: Vir["padding"]) {
        if (this.shorthandIsEqual(this.__values["padding"], v)) return;

        this.__values["padding"] = v;

        const [top, right, bottom, left] = this.expandShorthand(v);
        this._setShadowIfVirtualUndef("paddingTop", top);
        this._setShadowIfVirtualUndef("paddingRight", right);
        this._setShadowIfVirtualUndef("paddingBottom", bottom);
        this._setShadowIfVirtualUndef("paddingLeft", left);
    }

    get paddingX(): Vir["paddingX"] {
        return this.__values["paddingX"];
    }
    set paddingX(v: Vir["paddingX"]) {
        if (this.__values["paddingX"] === v) return;
        this.__values["paddingX"] = v;

        this._setShadowIfVirtualUndef("paddingLeft", v);
        this._setShadowIfVirtualUndef("paddingRight", v);
    }

    get paddingY(): Vir["paddingY"] {
        return this.__values["paddingY"];
    }
    set paddingY(v: Vir["paddingY"]) {
        if (this.__values["paddingY"] === v) return;
        this.__values["paddingY"] = v;

        this._setShadowIfVirtualUndef("paddingTop", v);
        this._setShadowIfVirtualUndef("paddingBottom", v);
    }

    get paddingTop(): Vir["paddingTop"] {
        return this.__values["paddingTop"];
    }
    set paddingTop(v: Vir["paddingTop"]) {
        if (this.__values["paddingTop"] === v) return;
        this._setBoth("paddingTop", v);
    }

    get paddingBottom(): Vir["paddingBottom"] {
        return this.__values["paddingBottom"];
    }
    set paddingBottom(v: Vir["paddingBottom"]) {
        if (this.__values["paddingBottom"] === v) return;
        this._setBoth("paddingBottom", v);
    }

    get paddingLeft(): Vir["paddingLeft"] {
        return this.__values["paddingLeft"];
    }
    set paddingLeft(v: Vir["paddingLeft"]) {
        if (this.__values["paddingLeft"] === v) return;
        this._setBoth("paddingLeft", v);
    }

    get paddingRight(): Vir["paddingRight"] {
        return this.__values["paddingRight"];
    }
    set paddingRight(v: Vir["paddingRight"]) {
        if (this.__values["paddingRight"] === v) return;
        this._setBoth("paddingRight", v);
    }

    get position(): Vir["position"] {
        return this.__values["position"];
    }
    set position(v: Vir["position"]) {
        if (this.__values["position"] === v) return;
        this._setBoth("position", v);
    }

    get display(): Vir["display"] {
        return this.__values["display"];
    }
    set display(v: Vir["display"]) {
        if (this.__values["display"] === v) return;
        this._setBoth("display", v);
    }

    get flexGrow(): Vir["flexGrow"] {
        return this.__values["flexGrow"];
    }
    set flexGrow(v: Vir["flexGrow"]) {
        if (this.__values["flexGrow"] === v) return;
        this._setBoth("flexGrow", v);
    }

    get flexShrink(): Vir["flexShrink"] {
        return this.__values["flexShrink"];
    }
    set flexShrink(v: Vir["flexShrink"]) {
        if (this.__values["flexShrink"] === v) return;
        this._setBoth("flexShrink", v);
    }

    get flexDirection(): Vir["flexDirection"] {
        return this.__values["flexDirection"];
    }
    set flexDirection(v: Vir["flexDirection"]) {
        if (this.__values["flexDirection"] === v) return;
        this._setBoth("flexDirection", v);
    }

    get flexBasis(): Vir["flexBasis"] {
        return this.__values["flexBasis"];
    }
    set flexBasis(v: Vir["flexBasis"]) {
        if (this.__values["flexBasis"] === v) return;
        this._setBoth("flexBasis", v);
    }

    get flexWrap(): Vir["flexWrap"] {
        return this.__values["flexWrap"];
    }
    set flexWrap(v: Vir["flexWrap"]) {
        if (this.__values["flexWrap"] === v) return;
        this._setBoth("flexWrap", v);
    }

    get alignItems(): Vir["alignItems"] {
        return this.__values["alignItems"];
    }
    set alignItems(v: Vir["alignItems"]) {
        if (this.__values["alignItems"] === v) return;
        this._setBoth("alignItems", v);
    }

    get alignSelf(): Vir["alignSelf"] {
        return this.__values["alignSelf"];
    }
    set alignSelf(v: Vir["alignSelf"]) {
        if (this.__values["alignSelf"] === v) return;
        this.__values["alignSelf"] = v;
        this.__shadow["alignSelf"] = Sanitizers.alignSelf(v);
    }

    get justifyContent(): Vir["justifyContent"] {
        return this.__values["justifyContent"];
    }
    set justifyContent(v: Vir["justifyContent"]) {
        if (this.__values["justifyContent"] === v) return;
        this._setBoth("justifyContent", v);
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
        this._setBoth("columnGap", v);
    }

    get rowGap(): Vir["rowGap"] {
        return this.__values["rowGap"];
    }
    set rowGap(v: Vir["rowGap"]) {
        if (this.__values["rowGap"] === v) return;
        this._setBoth("rowGap", v);
    }

    get zIndex(): Vir["zIndex"] {
        return this.__values["zIndex"];
    }
    set zIndex(v: Vir["zIndex"]) {
        if (this.__values["zIndex"] === v) return;
        this.__values["zIndex"] = v;
        this.__shadow["zIndex"] = Sanitizers.zIndex(v);
    }

    get backgroundColor(): Vir["backgroundColor"] {
        return this.__values["backgroundColor"];
    }
    set backgroundColor(v: Vir["backgroundColor"]) {
        if (this.__values["backgroundColor"] === v) return;
        this._setBoth("backgroundColor", v);
    }

    get backgroundStyle(): Vir["backgroundStyle"] {
        return this.__values["backgroundStyle"];
    }
    set backgroundStyle(v: Vir["backgroundStyle"]) {
        if (this.__values["backgroundStyle"] === v) return;
        this._setBoth("backgroundStyle", v);
    }

    get backgroundStyleColor(): Vir["backgroundStyleColor"] {
        return this.__values["backgroundStyleColor"];
    }
    set backgroundStyleColor(v: Vir["backgroundStyleColor"]) {
        if (this.__values["backgroundStyleColor"] === v) return;
        this._setBoth("backgroundStyleColor", v);
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
        this._setBoth("overflowX", v);
    }

    get overflowY(): Vir["overflowY"] {
        return this.__values["overflowY"];
    }
    set overflowY(v: Vir["overflowY"]) {
        if (this.__values["overflowY"] === v) return;
        this._setBoth("overflowY", v);
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
        this._setBoth("borderTop", v);
    }

    get borderBottom(): Vir["borderBottom"] {
        return this.__values["borderBottom"];
    }
    set borderBottom(v: Vir["borderBottom"]) {
        if (this.__values["borderBottom"] === v) return;
        this._setBoth("borderBottom", v);
    }

    get borderLeft(): Vir["borderLeft"] {
        return this.__values["borderLeft"];
    }
    set borderLeft(v: Vir["borderLeft"]) {
        if (this.__values["borderLeft"] === v) return;
        this._setBoth("borderLeft", v);
    }

    get borderRight(): Vir["borderRight"] {
        return this.__values["borderRight"];
    }
    set borderRight(v: Vir["borderRight"]) {
        if (this.__values["borderRight"] === v) return;
        this._setBoth("borderRight", v);
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
        this._setBoth("borderTopColor", v);
    }

    get borderBottomColor(): Vir["borderBottomColor"] {
        return this.__values["borderBottomColor"];
    }
    set borderBottomColor(v: Vir["borderBottomColor"]) {
        if (this.__values["borderBottomColor"] === v) return;
        this._setBoth("borderBottomColor", v);
    }

    get borderLeftColor(): Vir["borderLeftColor"] {
        return this.__values["borderLeftColor"];
    }
    set borderLeftColor(v: Vir["borderLeftColor"]) {
        if (this.__values["borderLeftColor"] === v) return;
        this._setBoth("borderLeftColor", v);
    }

    get borderRightColor(): Vir["borderRightColor"] {
        return this.__values["borderRightColor"];
    }
    set borderRightColor(v: Vir["borderRightColor"]) {
        if (this.__values["borderRightColor"] === v) return;
        this._setBoth("borderRightColor", v);
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
        this._setBoth("borderTopDimColor", v);
    }

    get borderBottomDimColor(): Vir["borderBottomDimColor"] {
        return this.__values["borderBottomDimColor"];
    }
    set borderBottomDimColor(v: Vir["borderBottomDimColor"]) {
        if (this.__values["borderBottomDimColor"] === v) return;
        this._setBoth("borderBottomDimColor", v);
    }

    get borderLeftDimColor(): Vir["borderLeftDimColor"] {
        return this.__values["borderLeftDimColor"];
    }
    set borderLeftDimColor(v: Vir["borderLeftDimColor"]) {
        if (this.__values["borderLeftDimColor"] === v) return;
        this._setBoth("borderLeftDimColor", v);
    }

    get borderRightDimColor(): Vir["borderRightDimColor"] {
        return this.__values["borderRightDimColor"];
    }
    set borderRightDimColor(v: Vir["borderRightDimColor"]) {
        if (this.__values["borderRightDimColor"] === v) return;
        this._setBoth("borderRightDimColor", v);
    }

    get _scrollbarPaddingLeft(): Vir["_scrollbarPaddingLeft"] {
        return this.__values["_scrollbarPaddingLeft"];
    }
    set _scrollbarPaddingLeft(v: Vir["_scrollbarPaddingLeft"]) {
        if (this.__values["_scrollbarPaddingLeft"] === v) return;
        this._setBoth("_scrollbarBorderLeft", v);
    }

    get _scrollbarPaddingRight(): Vir["_scrollbarPaddingRight"] {
        return this.__values["_scrollbarPaddingRight"];
    }
    set _scrollbarPaddingRight(v: Vir["_scrollbarPaddingRight"]) {
        if (this.__values["_scrollbarPaddingRight"] === v) return;
        this._setBoth("_scrollbarPaddingRight", v);
    }

    get _scrollbarPaddingTop(): Vir["_scrollbarPaddingTop"] {
        return this.__values["_scrollbarPaddingTop"];
    }
    set _scrollbarPaddingTop(v: Vir["_scrollbarPaddingTop"]) {
        if (this.__values["_scrollbarPaddingTop"] === v) return;
        this._setBoth("_scrollbarBorderTop", v);
    }

    get _scrollbarPaddingBottom(): Vir["_scrollbarPaddingBottom"] {
        return this.__values["_scrollbarPaddingBottom"];
    }
    set _scrollbarPaddingBottom(v: Vir["_scrollbarPaddingBottom"]) {
        if (this.__values["_scrollbarPaddingBottom"] === v) return;
        this._setBoth("_scrollbarPaddingBottom", v);
    }

    get _scrollbarBorderLeft(): Vir["_scrollbarBorderLeft"] {
        return this.__values["_scrollbarBorderLeft"];
    }
    set _scrollbarBorderLeft(v: Vir["_scrollbarBorderLeft"]) {
        if (this.__values["_scrollbarBorderLeft"] === v) return;
        this._setBoth("_scrollbarBorderLeft", v);
    }

    get _scrollbarBorderRight(): Vir["_scrollbarBorderRight"] {
        return this.__values["_scrollbarBorderRight"];
    }
    set _scrollbarBorderRight(v: Vir["_scrollbarBorderRight"]) {
        if (this.__values["_scrollbarBorderRight"] === v) return;
        this._setBoth("_scrollbarBorderRight", v);
    }

    get _scrollbarBorderTop(): Vir["_scrollbarBorderTop"] {
        return this.__values["_scrollbarBorderTop"];
    }
    set _scrollbarBorderTop(v: Vir["_scrollbarBorderTop"]) {
        if (this.__values["_scrollbarBorderTop"] === v) return;
        this._setBoth("_scrollbarBorderTop", v);
    }

    get _scrollbarBorderBottom(): Vir["_scrollbarBorderBottom"] {
        return this.__values["_scrollbarBorderBottom"];
    }
    set _scrollbarBorderBottom(v: Vir["_scrollbarBorderBottom"]) {
        if (this.__values["_scrollbarBorderBottom"] === v) return;
        this._setBoth("_scrollbarBorderBottom", v);
    }

    // ***** TEXT *****

    get color(): Vir["color"] {
        return this.__values["color"];
    }
    set color(v: Vir["color"]) {
        if (this.__values["color"] === v) return;
        this._setBoth("color", v);
    }

    // backgroundColor overlaps that of regular styles

    get dimColor(): Vir["dimColor"] {
        return this.__values["dimColor"];
    }
    set dimColor(v: Vir["dimColor"]) {
        if (this.__values["dimColor"] === v) return;
        this._setBoth("dimColor", v);
    }

    get bold(): Vir["bold"] {
        return this.__values["bold"];
    }
    set bold(v: Vir["bold"]) {
        if (this.__values["bold"] === v) return;
        this._setBoth("bold", v);
    }

    get italic(): Vir["italic"] {
        return this.__values["italic"];
    }
    set italic(v: Vir["italic"]) {
        if (this.__values["italic"] === v) return;
        this._setBoth("italic", v);
    }

    get underline(): Vir["underline"] {
        return this.__values["underline"];
    }
    set underline(v: Vir["underline"]) {
        if (this.__values["underline"] === v) return;
        this._setBoth("underline", v);
    }

    get strikethrough(): Vir["strikethrough"] {
        return this.__values["strikethrough"];
    }
    set strikethrough(v: Vir["strikethrough"]) {
        if (this.__values["strikethrough"] === v) return;
        this._setBoth("strikethrough", v);
    }

    get wrap(): Vir["wrap"] {
        return this.__values["wrap"];
    }
    set wrap(v: Vir["wrap"]) {
        if (this.__values["wrap"] === v) return;
        this._setBoth("wrap", v);
    }

    get align(): Vir["align"] {
        return this.__values["align"];
    }
    set align(v: Vir["align"]) {
        if (this.__values["align"] === v) return;
        this._setBoth("align", v);
    }

    get imagePositive(): Vir["imagePositive"] {
        return this.__values["imagePositive"];
    }
    set imagePositive(v: Vir["imagePositive"]) {
        if (this.__values["imagePositive"] === v) return;
        this._setBoth("imagePositive", v);
    }

    get imageNegative(): Vir["imageNegative"] {
        return this.__values["imageNegative"];
    }
    set imageNegative(v: Vir["imageNegative"]) {
        if (this.__values["imageNegative"] === v) return;
        this._setBoth("imageNegative", v);
    }

    get fontDefault(): Vir["fontDefault"] {
        return this.__values["fontDefault"];
    }
    set fontDefault(v: Vir["fontDefault"]) {
        if (this.__values["fontDefault"] === v) return;
        this._setBoth("fontDefault", v);
    }

    get font1(): Vir["font1"] {
        return this.__values["font1"];
    }
    set font1(v: Vir["font1"]) {
        if (this.__values["font1"] === v) return;
        this._setBoth("font1", v);
    }

    get font2(): Vir["font2"] {
        return this.__values["font2"];
    }
    set font2(v: Vir["font2"]) {
        if (this.__values["font2"] === v) return;
        this._setBoth("font3", v);
    }

    get font3(): Vir["font3"] {
        return this.__values["font3"];
    }
    set font3(v: Vir["font3"]) {
        if (this.__values["font3"] === v) return;
        this._setBoth("font3", v);
    }

    get font4(): Vir["font4"] {
        return this.__values["font4"];
    }
    set font4(v: Vir["font4"]) {
        if (this.__values["font4"] === v) return;
        this._setBoth("font4", v);
    }

    get font5(): Vir["font5"] {
        return this.__values["font5"];
    }
    set font5(v: Vir["font5"]) {
        if (this.__values["font5"] === v) return;
        this._setBoth("font5", v);
    }

    get font6(): Vir["font6"] {
        return this.__values["font6"];
    }
    set font6(v: Vir["font6"]) {
        if (this.__values["font6"] === v) return;
        this._setBoth("font6", v);
    }
}
