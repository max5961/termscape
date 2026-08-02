import { Yg } from "../../../Constants.js";
import type { YogaNode, WriteOpts } from "../../../Types.js";
import type { DomElement } from "../../DomElement.js";
import type { Style, Shadow } from "../Style.js";

type Vir = Style.All;
type Sha = Shadow<Style.All>;
type NoUndef<T> = Exclude<T, undefined>;

/**
 * Getters return stored values or the defaults if unset
 * Setters sanitize data, apply yoga styles, and request re-renders
 * */
export class ShadowStyleProxy {
    protected values: Record<string, any>;
    protected node: YogaNode;
    protected host: DomElement;

    constructor(node: YogaNode, host: DomElement) {
        this.values = {};
        this.node = node;
        this.host = host;
    }

    protected scheduleRender(opts?: WriteOpts) {
        this.host._metadata.getRoot()?.scheduleRender(opts);
    }

    get height(): Vir["height"] {
        return this.values["height"];
    }
    get computedHeight(): number {
        return this.node.getComputedHeight();
    }
    set height(v: Vir["height"]) {
        if (this.values["height"] === v) return;
        this.values["height"] = v;

        if (typeof v === "number") {
            this.node.setHeight(v);
        } else if (typeof v === "string") {
            this.node.setHeightPercent(Number.parseInt(v, 10));
        } else {
            this.node.setHeightAuto();
        }
    }

    get width(): Vir["width"] {
        return this.values["width"];
    }
    get computedWidth() {
        return this.node.getComputedWidth();
    }
    set width(v: Vir["width"]) {
        if (this.values["width"] === v) return;
        this.values["width"] = v;

        if (typeof v === "number") {
            this.node.setWidth(v);
        } else if (typeof v === "string") {
            this.node.setWidthPercent(Number.parseInt(v, 10));
        } else {
            this.node.setWidthAuto();
        }
    }

    get minHeight(): NoUndef<Vir["minHeight"]> {
        return this.values["minHeight"] ?? 0;
    }
    set minHeight(v: Vir["minHeight"]) {
        if (this.values["minHeight"] === v) return;

        this.values["minHeight"] = v;

        if (typeof this.minHeight === "string") {
            this.node.setMinHeightPercent(Number.parseInt(this.minHeight, 10));
        } else {
            this.node.setMinHeight(this.minHeight);
        }
    }

    get minWidth(): NoUndef<Vir["minWidth"]> {
        return this.values["minWidth"];
    }
    set minWidth(v: Vir["minWidth"]) {
        if (this.values["minWidth"] === v) return;

        this.values["minWidth"] = v;

        if (typeof this.minWidth === "string") {
            this.node.setMinWidthPercent(Number.parseInt(this.minWidth, 10));
        } else {
            this.node.setMinWidth(this.minWidth);
        }
    }

    get margin(): Vir["margin"] {
        return this.values["margin"];
    }
    set margin(v: Vir["margin"]) {
        if (this.values["margin"] === v) return;
        this.values["margin"] = v;
    }

    get marginX(): Vir["marginX"] {
        return this.values["marginX"];
    }
    set marginX(v: Vir["marginX"]) {
        if (this.values["marginX"] === v) return;
        this.values["marginX"] = v;
    }

    get marginY(): Vir["marginY"] {
        return this.values["marginY"];
    }
    set marginY(v: Vir["marginY"]) {
        if (this.values["marginY"] === v) return;
        this.values["marginY"] = v;
    }

    get marginTop(): NoUndef<Vir["marginTop"]> {
        return this.values["marginTop"] ?? 0;
    }
    set marginTop(v: Vir["marginTop"]) {
        if (this.values["marginTop"] === v) return;

        this.values["marginTop"] = v;
        this.node.setMargin(Yg.EDGE_TOP, this.marginTop);
    }

    get marginBottom(): NoUndef<Vir["marginBottom"]> {
        return this.values["marginBottom"] ?? 0;
    }
    set marginBottom(v: Vir["marginBottom"]) {
        if (this.values["marginBottom"] === v) return;

        this.values["marginBottom"] = v;
        this.node.setMargin(Yg.EDGE_BOTTOM, this.marginBottom);
    }

    get marginLeft(): Vir["marginLeft"] {
        return this.values["marginLeft"];
    }
    set marginLeft(v: Vir["marginLeft"]) {
        if (this.values["marginLeft"] === v) return;

        this.values["marginLeft"] = v;
        this.node.setMargin(Yg.EDGE_LEFT, v ?? 0);
    }

    get marginRight(): Vir["marginRight"] {
        return this.node.getComputedMargin(Yg.EDGE_RIGHT);
    }
    set marginRight(v: Vir["marginRight"]) {
        if (this.values["marginRight"] === v) return;

        this.values["marginRight"] = v;
        this.node.setMargin(Yg.EDGE_RIGHT, v ?? 0);
    }

    get padding(): Vir["padding"] {
        return this.values["padding"];
    }
    set padding(v: Vir["padding"]) {
        if (this.values["padding"] === v) return;
        this.values["padding"] = v;
    }

    get paddingX(): Vir["paddingX"] {
        return this.values["paddingX"] ?? 0;
    }
    set paddingX(v: Vir["paddingX"]) {
        if (this.values["paddingX"] === v) return;
        this.values["paddingX"] = v;
    }

    get paddingY(): Vir["paddingY"] {
        return this.values["paddingY"] ?? 0;
    }
    set paddingY(v: Vir["paddingY"]) {
        if (this.values["paddingY"] === v) return;
        this.values["paddingY"] = v;
    }

    get paddingTop(): Vir["paddingTop"] {
        return this.values["paddingTop"] ?? 0;
    }
    set paddingTop(v: Vir["paddingTop"]) {
        if (this.values["paddingTop"] === v) return;

        this.values["paddingTop"] = v;
        this.node.setPadding(Yg.EDGE_TOP, v ?? 0);
    }

    get paddingBottom(): Vir["paddingBottom"] {
        return this.node.getComputedPadding(Yg.EDGE_BOTTOM);
    }
    set paddingBottom(v: Vir["paddingBottom"]) {
        if (this.values["paddingBottom"] === v) return;

        this.values["paddingBottom"] = v;
        this.node.setPadding(Yg.EDGE_BOTTOM, v ?? 0);
    }

    get paddingLeft(): Vir["paddingLeft"] {
        return this.node.getComputedPadding(Yg.EDGE_LEFT);
    }
    set paddingLeft(v: Vir["paddingLeft"]) {
        if (this.values["paddingLeft"] === v) return;

        this.values["paddingLeft"] = v;
        this.node.setPadding(Yg.EDGE_LEFT, v ?? 0);
    }

    get paddingRight(): Vir["paddingRight"] {
        return this.node.getComputedPadding(Yg.EDGE_RIGHT);
    }
    set paddingRight(v: Vir["paddingRight"]) {
        if (this.values["paddingRight"] === v) return;

        this.values["paddingRight"] = v;
        this.node.setPadding(Yg.EDGE_RIGHT, v ?? 0);
    }

    get position(): Vir["position"] {
        return this.values["position"] ?? "relative";
    }
    set position(v: Vir["position"]) {
        if (this.values["position"] === v) return;

        this.values["position"] = v;
        this.node.setPositionType(
            v === "absolute" ? Yg.POSITION_TYPE_ABSOLUTE : Yg.POSITION_TYPE_RELATIVE,
        );
    }

    get display(): Vir["display"] {
        return this.values["display"] ?? "flex";
    }
    set display(v: Vir["display"]) {
        if (this.values["display"] === v) return;

        this.values["display"] = v;
        this.node.setDisplay(v === "flex" ? Yg.DISPLAY_FLEX : Yg.DISPLAY_NONE);
    }

    get flexGrow(): Vir["flexGrow"] {
        return this.values["flexGrow"];
    }
    set flexGrow(v: Vir["flexGrow"]) {
        if (this.values["flexGrow"] === v) return;
        this.values["flexGrow"] = v;
    }

    get flexShrink(): Vir["flexShrink"] {
        return this.values["flexShrink"];
    }
    set flexShrink(v: Vir["flexShrink"]) {
        if (this.values["flexShrink"] === v) return;
        this.values["flexShrink"] = v;
    }

    get flexDirection(): Vir["flexDirection"] {
        return this.values["flexDirection"];
    }
    set flexDirection(v: Vir["flexDirection"]) {
        if (this.values["flexDirection"] === v) return;
        this.values["flexDirection"] = v;
    }

    get flexBasis(): Vir["flexBasis"] {
        return this.values["flexBasis"];
    }
    set flexBasis(v: Vir["flexBasis"]) {
        if (this.values["flexBasis"] === v) return;
        this.values["flexBasis"] = v;
    }

    get flexWrap(): Vir["flexWrap"] {
        return this.values["flexWrap"];
    }
    set flexWrap(v: Vir["flexWrap"]) {
        if (this.values["flexWrap"] === v) return;
        this.values["flexWrap"] = v;
    }

    get alignItems(): Vir["alignItems"] {
        return this.values["alignItems"];
    }
    set alignItems(v: Vir["alignItems"]) {
        if (this.values["alignItems"] === v) return;
        this.values["alignItems"] = v;
    }

    get alignSelf(): Vir["alignSelf"] {
        return this.values["alignSelf"];
    }
    set alignSelf(v: Vir["alignSelf"]) {
        if (this.values["alignSelf"] === v) return;
        this.values["alignSelf"] = v;
    }

    get justifyContent(): Vir["justifyContent"] {
        return this.values["justifyContent"];
    }
    set justifyContent(v: Vir["justifyContent"]) {
        if (this.values["justifyContent"] === v) return;
        this.values["justifyContent"] = v;
    }

    get gap(): Vir["gap"] {
        return this.values["gap"];
    }
    set gap(v: Vir["gap"]) {
        if (this.values["gap"] === v) return;
        this.values["gap"] = v;
    }

    get columnGap(): Vir["columnGap"] {
        return this.values["columnGap"];
    }
    set columnGap(v: Vir["columnGap"]) {
        if (this.values["columnGap"] === v) return;
        this.values["columnGap"] = v;
    }

    get rowGap(): Vir["rowGap"] {
        return this.values["rowGap"];
    }
    set rowGap(v: Vir["rowGap"]) {
        if (this.values["rowGap"] === v) return;
        this.values["rowGap"] = v;
    }

    get zIndex(): Vir["zIndex"] {
        return this.values["zIndex"];
    }
    set zIndex(v: Vir["zIndex"]) {
        if (this.values["zIndex"] === v) return;
        this.values["zIndex"] = v;
    }

    get backgroundColor(): Vir["backgroundColor"] {
        return this.values["backgroundColor"];
    }
    set backgroundColor(v: Vir["backgroundColor"]) {
        if (this.values["backgroundColor"] === v) return;
        this.values["backgroundColor"] = v;
    }

    get backgroundStyle(): Vir["backgroundStyle"] {
        return this.values["backgroundStyle"];
    }
    set backgroundStyle(v: Vir["backgroundStyle"]) {
        if (this.values["backgroundStyle"] === v) return;
        this.values["backgroundStyle"] = v;
    }

    get backgroundStyleColor(): Vir["backgroundStyleColor"] {
        return this.values["backgroundStyleColor"];
    }
    set backgroundStyleColor(v: Vir["backgroundStyleColor"]) {
        if (this.values["backgroundStyleColor"] === v) return;
        this.values["backgroundStyleColor"] = v;
    }

    get overflow(): Vir["overflow"] {
        return this.values["overflow"];
    }
    set overflow(v: Vir["overflow"]) {
        if (this.values["overflow"] === v) return;
        this.values["overflow"] = v;
    }

    get overflowX(): Vir["overflowX"] {
        return this.values["overflowX"];
    }
    set overflowX(v: Vir["overflowX"]) {
        if (this.values["overflowX"] === v) return;
        this.values["overflowX"] = v;
    }

    get overflowY(): Vir["overflowY"] {
        return this.values["overflowY"];
    }
    set overflowY(v: Vir["overflowY"]) {
        if (this.values["overflowY"] === v) return;
        this.values["overflowY"] = v;
    }

    get borderStyle(): Vir["borderStyle"] {
        return this.values["borderStyle"];
    }
    set borderStyle(v: Vir["borderStyle"]) {
        if (this.values["borderStyle"] === v) return;
        this.values["borderStyle"] = v;
    }

    get borderTop(): Vir["borderTop"] {
        return this.values["borderTop"];
    }
    set borderTop(v: Vir["borderTop"]) {
        if (this.values["borderTop"] === v) return;
        this.values["borderTop"] = v;
    }

    get borderBottom(): Vir["borderBottom"] {
        return this.values["borderBottom"];
    }
    set borderBottom(v: Vir["borderBottom"]) {
        if (this.values["borderBottom"] === v) return;
        this.values["borderBottom"] = v;
    }

    get borderLeft(): Vir["borderLeft"] {
        return this.values["borderLeft"];
    }
    set borderLeft(v: Vir["borderLeft"]) {
        if (this.values["borderLeft"] === v) return;
        this.values["borderLeft"] = v;
    }

    get borderRight(): Vir["borderRight"] {
        return this.values["borderRight"];
    }
    set borderRight(v: Vir["borderRight"]) {
        if (this.values["borderRight"] === v) return;
        this.values["borderRight"] = v;
    }

    get borderColor(): Vir["borderColor"] {
        return this.values["borderColor"];
    }
    set borderColor(v: Vir["borderColor"]) {
        if (this.values["borderColor"] === v) return;
        this.values["borderColor"] = v;
    }

    get borderTopColor(): Vir["borderTopColor"] {
        return this.values["borderTopColor"];
    }
    set borderTopColor(v: Vir["borderTopColor"]) {
        if (this.values["borderTopColor"] === v) return;
        this.values["borderTopColor"] = v;
    }

    get borderBottomColor(): Vir["borderBottomColor"] {
        return this.values["borderBottomColor"];
    }
    set borderBottomColor(v: Vir["borderBottomColor"]) {
        if (this.values["borderBottomColor"] === v) return;
        this.values["borderBottomColor"] = v;
    }

    get borderLeftColor(): Vir["borderLeftColor"] {
        return this.values["borderLeftColor"];
    }
    set borderLeftColor(v: Vir["borderLeftColor"]) {
        if (this.values["borderLeftColor"] === v) return;
        this.values["borderLeftColor"] = v;
    }

    get borderRightColor(): Vir["borderRightColor"] {
        return this.values["borderRightColor"];
    }
    set borderRightColor(v: Vir["borderRightColor"]) {
        if (this.values["borderRightColor"] === v) return;
        this.values["borderRightColor"] = v;
    }

    get borderDimColor(): Vir["borderDimColor"] {
        return this.values["borderDimColor"];
    }
    set borderDimColor(v: Vir["borderDimColor"]) {
        if (this.values["borderDimColor"] === v) return;
        this.values["borderDimColor"] = v;
    }

    get borderTopDimColor(): Vir["borderTopDimColor"] {
        return this.values["borderTopDimColor"];
    }
    set borderTopDimColor(v: Vir["borderTopDimColor"]) {
        if (this.values["borderTopDimColor"] === v) return;
        this.values["borderTopDimColor"] = v;
    }

    get borderBottomDimColor(): Vir["borderBottomDimColor"] {
        return this.values["borderBottomDimColor"];
    }
    set borderBottomDimColor(v: Vir["borderBottomDimColor"]) {
        if (this.values["borderBottomDimColor"] === v) return;
        this.values["borderBottomDimColor"] = v;
    }

    get borderLeftDimColor(): Vir["borderLeftDimColor"] {
        return this.values["borderLeftDimColor"];
    }
    set borderLeftDimColor(v: Vir["borderLeftDimColor"]) {
        if (this.values["borderLeftDimColor"] === v) return;
        this.values["borderLeftDimColor"] = v;
    }

    get borderRightDimColor(): Vir["borderRightDimColor"] {
        return this.values["borderRightDimColor"];
    }
    set borderRightDimColor(v: Vir["borderRightDimColor"]) {
        if (this.values["borderRightDimColor"] === v) return;
        this.values["borderRightDimColor"] = v;
    }

    get _scrollbarPaddingLeft(): Vir["_scrollbarPaddingLeft"] {
        return this.values["_scrollbarPaddingLeft"];
    }
    set _scrollbarPaddingLeft(v: Vir["_scrollbarPaddingLeft"]) {
        if (this.values["_scrollbarPaddingLeft"] === v) return;
        this.values["_scrollbarPaddingLeft"] = v;
    }

    get _scrollbarPaddingRight(): Vir["_scrollbarPaddingRight"] {
        return this.values["_scrollbarPaddingRight"];
    }
    set _scrollbarPaddingRight(v: Vir["_scrollbarPaddingRight"]) {
        if (this.values["_scrollbarPaddingRight"] === v) return;
        this.values["_scrollbarPaddingRight"] = v;
    }

    get _scrollbarPaddingTop(): Vir["_scrollbarPaddingTop"] {
        return this.values["_scrollbarPaddingTop"];
    }
    set _scrollbarPaddingTop(v: Vir["_scrollbarPaddingTop"]) {
        if (this.values["_scrollbarPaddingTop"] === v) return;
        this.values["_scrollbarPaddingTop"] = v;
    }

    get _scrollbarPaddingBottom(): Vir["_scrollbarPaddingBottom"] {
        return this.values["_scrollbarPaddingBottom"];
    }
    set _scrollbarPaddingBottom(v: Vir["_scrollbarPaddingBottom"]) {
        if (this.values["_scrollbarPaddingBottom"] === v) return;
        this.values["_scrollbarPaddingBottom"] = v;
    }

    get _scrollbarBorderLeft(): Vir["_scrollbarBorderLeft"] {
        return this.values["_scrollbarBorderLeft"];
    }
    set _scrollbarBorderLeft(v: Vir["_scrollbarBorderLeft"]) {
        if (this.values["_scrollbarBorderLeft"] === v) return;
        this.values["_scrollbarBorderLeft"] = v;
    }

    get _scrollbarBorderRight(): Vir["_scrollbarBorderRight"] {
        return this.values["_scrollbarBorderRight"];
    }
    set _scrollbarBorderRight(v: Vir["_scrollbarBorderRight"]) {
        if (this.values["_scrollbarBorderRight"] === v) return;
        this.values["_scrollbarBorderRight"] = v;
    }

    get _scrollbarBorderTop(): Vir["_scrollbarBorderTop"] {
        return this.values["_scrollbarBorderTop"];
    }
    set _scrollbarBorderTop(v: Vir["_scrollbarBorderTop"]) {
        if (this.values["_scrollbarBorderTop"] === v) return;
        this.values["_scrollbarBorderTop"] = v;
    }

    get _scrollbarBorderBottom(): Vir["_scrollbarBorderBottom"] {
        return this.values["_scrollbarBorderBottom"];
    }
    set _scrollbarBorderBottom(v: Vir["_scrollbarBorderBottom"]) {
        if (this.values["_scrollbarBorderBottom"] === v) return;
        this.values["_scrollbarBorderBottom"] = v;
    }

    // ***** TEXT *****

    get color(): Vir["color"] {
        return this.values["color"];
    }
    set color(v: Vir["color"]) {
        if (this.values["color"] === v) return;
        this.values["color"] = v;
    }

    // backgroundColor overlaps that of regular styles

    get dimColor(): Vir["dimColor"] {
        return this.values["dimColor"];
    }
    set dimColor(v: Vir["dimColor"]) {
        if (this.values["dimColor"] === v) return;
        this.values["dimColor"] = v;
    }

    get bold(): Vir["bold"] {
        return this.values["bold"];
    }
    set bold(v: Vir["bold"]) {
        if (this.values["bold"] === v) return;
        this.values["bold"] = v;
    }

    get italic(): Vir["italic"] {
        return this.values["italic"];
    }
    set italic(v: Vir["italic"]) {
        if (this.values["italic"] === v) return;
        this.values["italic"] = v;
    }

    get underline(): Vir["underline"] {
        return this.values["underline"];
    }
    set underline(v: Vir["underline"]) {
        if (this.values["underline"] === v) return;
        this.values["underline"] = v;
    }

    get strikethrough(): Vir["strikethrough"] {
        return this.values["strikethrough"];
    }
    set strikethrough(v: Vir["strikethrough"]) {
        if (this.values["strikethrough"] === v) return;
        this.values["strikethrough"] = v;
    }

    get wrap(): Vir["wrap"] {
        return this.values["wrap"];
    }
    set wrap(v: Vir["wrap"]) {
        if (this.values["wrap"] === v) return;
        this.values["wrap"] = v;
    }

    get align(): Vir["align"] {
        return this.values["align"];
    }
    set align(v: Vir["align"]) {
        if (this.values["align"] === v) return;
        this.values["align"] = v;
    }

    get imagePositive(): Vir["imagePositive"] {
        return this.values["imagePositive"];
    }
    set imagePositive(v: Vir["imagePositive"]) {
        if (this.values["imagePositive"] === v) return;
        this.values["imagePositive"] = v;
    }

    get imageNegative(): Vir["imageNegative"] {
        return this.values["imageNegative"];
    }
    set imageNegative(v: Vir["imageNegative"]) {
        if (this.values["imageNegative"] === v) return;
        this.values["imageNegative"] = v;
    }

    get fontDefault(): Vir["fontDefault"] {
        return this.values["fontDefault"];
    }
    set fontDefault(v: Vir["fontDefault"]) {
        if (this.values["fontDefault"] === v) return;
        this.values["fontDefault"] = v;
    }

    get font1(): Vir["font1"] {
        return this.values["font1"];
    }
    set font1(v: Vir["font1"]) {
        if (this.values["font1"] === v) return;
        this.values["font1"] = v;
    }

    get font2(): Vir["font2"] {
        return this.values["font2"];
    }
    set font2(v: Vir["font2"]) {
        if (this.values["font2"] === v) return;
        this.values["font2"] = v;
    }

    get font3(): Vir["font3"] {
        return this.values["font3"];
    }
    set font3(v: Vir["font3"]) {
        if (this.values["font3"] === v) return;
        this.values["font3"] = v;
    }

    get font4(): Vir["font4"] {
        return this.values["font4"];
    }
    set font4(v: Vir["font4"]) {
        if (this.values["font4"] === v) return;
        this.values["font4"] = v;
    }

    get font5(): Vir["font5"] {
        return this.values["font5"];
    }
    set font5(v: Vir["font5"]) {
        if (this.values["font5"] === v) return;
        this.values["font5"] = v;
    }

    get font6(): Vir["font6"] {
        return this.values["font6"];
    }
    set font6(v: Vir["font6"]) {
        if (this.values["font6"] === v) return;
        this.values["font6"] = v;
    }
}

class ShadowBox extends ShadowStyleProxy {
    constructor(node: YogaNode, host: DomElement) {
        super(node, host);
    }

    override get marginTop() {
        return this.values["marginTop"] ?? 5;
    }
}
