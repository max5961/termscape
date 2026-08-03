import { Yg } from "../../../Constants.js";
import type { YogaNode, WriteOpts } from "../../../Types.js";
import type { DomElement } from "../../DomElement.js";
import type { Shadow, Style } from "../Style.js";

type Sha = Shadow<Style.All>;

/**
 * Getters return stored values or the defaults if unset
 * Setters sanitize data, apply yoga styles, and request re-renders
 * */
export class ShadowStyleProxy {
    protected values: Record<string, any>;
    protected node: YogaNode;
    protected host: DomElement;

    constructor(host: DomElement) {
        this.values = {};
        this.host = host;
        this.node = host._node;
    }

    protected scheduleRender(opts?: WriteOpts) {
        this.host._metadata.getRoot()?.scheduleRender(opts);
    }

    get height(): Sha["height"] {
        return this.values["height"];
    }
    get computedHeight(): number {
        return this.node.getComputedHeight();
    }
    set height(v: Sha["height"]) {
        if (this.values["height"] === v) return;
        this.values["height"] = v;

        if (typeof v === "number") {
            this.node.setHeight(v);
        } else if (typeof v === "string") {
            this.node.setHeightPercent(Number.parseInt(v, 10));
        } else {
            this.node.setHeightAuto();
        }

        this.scheduleRender({ layoutChange: true });
    }

    get width(): Sha["width"] {
        return this.values["width"];
    }
    get computedWidth() {
        return this.node.getComputedWidth();
    }
    set width(v: Sha["width"]) {
        if (this.values["width"] === v) return;
        this.values["width"] = v;

        if (typeof v === "number") {
            this.node.setWidth(v);
        } else if (typeof v === "string") {
            this.node.setWidthPercent(Number.parseInt(v, 10));
        } else {
            this.node.setWidthAuto();
        }

        this.scheduleRender({ layoutChange: true });
    }

    get minHeight(): Sha["minHeight"] {
        return this.values["minHeight"];
    }
    set minHeight(v: Sha["minHeight"]) {
        if (this.values["minHeight"] === v) return;

        this.values["minHeight"] = v;

        if (typeof this.minHeight === "string") {
            this.node.setMinHeightPercent(Number.parseInt(this.minHeight, 10));
        } else {
            this.node.setMinHeight(v ?? 0);
        }

        this.scheduleRender({ layoutChange: true });
    }

    get minWidth(): Sha["minWidth"] {
        return this.values["minWidth"] ?? 0;
    }
    set minWidth(v: Sha["minWidth"]) {
        if (this.values["minWidth"] === v) return;

        this.values["minWidth"] = v;

        if (typeof v === "string") {
            this.node.setMinWidthPercent(Number.parseInt(v, 10));
        } else {
            this.node.setMinWidth(this.minWidth ?? 0);
        }

        this.scheduleRender({ layoutChange: true });
    }

    get marginTop(): Sha["marginTop"] {
        return this.values["marginTop"];
    }
    get computedMarginTop() {
        return this.node.getComputedMargin(Yg.EDGE_TOP);
    }
    set marginTop(v: Sha["marginTop"]) {
        if (this.values["marginTop"] === v) return;

        this.values["marginTop"] = v;
        this.node.setMargin(Yg.EDGE_TOP, this.marginTop ?? 0);

        this.scheduleRender({ layoutChange: true });
    }

    get marginBottom(): Sha["marginBottom"] {
        return this.values["marginBottom"];
    }
    get computedMarginBottom() {
        return this.node.getComputedMargin(Yg.EDGE_BOTTOM);
    }
    set marginBottom(v: Sha["marginBottom"]) {
        if (this.values["marginBottom"] === v) return;

        this.values["marginBottom"] = v;
        this.node.setMargin(Yg.EDGE_BOTTOM, this.marginBottom ?? 0);

        this.scheduleRender({ layoutChange: true });
    }

    get marginLeft(): Sha["marginLeft"] {
        return this.values["marginLeft"];
    }
    get computedMarginLeft() {
        return this.node.getComputedMargin(Yg.EDGE_LEFT);
    }
    set marginLeft(v: Sha["marginLeft"]) {
        if (this.values["marginLeft"] === v) return;

        this.values["marginLeft"] = v;
        this.node.setMargin(Yg.EDGE_LEFT, v ?? 0);

        this.scheduleRender({ layoutChange: true });
    }

    get marginRight(): Sha["marginRight"] {
        return this.values["marginRight"];
    }
    get computedMarginRight() {
        return this.node.getComputedMargin(Yg.EDGE_RIGHT);
    }
    set marginRight(v: Sha["marginRight"]) {
        if (this.values["marginRight"] === v) return;

        this.values["marginRight"] = v;
        this.node.setMargin(Yg.EDGE_RIGHT, v ?? 0);

        this.scheduleRender({ layoutChange: true });
    }

    get paddingTop(): Sha["paddingTop"] {
        return this.values["paddingTop"];
    }
    get computedPaddingTop() {
        return this.node.getComputedPadding(Yg.EDGE_TOP);
    }
    set paddingTop(v: Sha["paddingTop"]) {
        if (this.values["paddingTop"] === v) return;

        this.values["paddingTop"] = v;
        this.node.setPadding(
            Yg.EDGE_TOP,
            Math.max(v ?? 0, this._scrollbarPaddingTop ?? 0),
        );

        this.scheduleRender({ layoutChange: true });
    }

    get paddingBottom(): Sha["paddingBottom"] {
        return this.values["paddingBottom"];
    }
    get computedPaddingBottom() {
        return this.node.getComputedPadding(Yg.EDGE_BOTTOM);
    }
    set paddingBottom(v: Sha["paddingBottom"]) {
        if (this.values["paddingBottom"] === v) return;

        this.values["paddingBottom"] = v;
        this.node.setPadding(
            Yg.EDGE_BOTTOM,
            Math.max(v ?? 0, this._scrollbarPaddingBottom ?? 0),
        );

        this.scheduleRender({ layoutChange: true });
    }

    get paddingLeft(): Sha["paddingLeft"] {
        return this.values["paddingLeft"];
    }
    get computedPaddingLeft() {
        return this.node.getComputedPadding(Yg.EDGE_LEFT);
    }
    set paddingLeft(v: Sha["paddingLeft"]) {
        if (this.values["paddingLeft"] === v) return;

        this.values["paddingLeft"] = v;
        this.node.setPadding(
            Yg.EDGE_LEFT,
            Math.max(v ?? 0, this._scrollbarPaddingLeft ?? 0),
        );

        this.scheduleRender({ layoutChange: true });
    }

    get paddingRight(): Sha["paddingRight"] {
        return this.values["paddingRight"];
    }
    get computedPaddingRight() {
        return this.node.getComputedPadding(Yg.EDGE_RIGHT);
    }
    set paddingRight(v: Sha["paddingRight"]) {
        if (this.values["paddingRight"] === v) return;

        this.values["paddingRight"] = v;
        this.node.setPadding(
            Yg.EDGE_RIGHT,
            Math.max(v ?? 0, this._scrollbarPaddingRight ?? 0),
        );

        this.scheduleRender({ layoutChange: true });
    }

    get position(): Sha["position"] {
        return this.values["position"];
    }
    set position(v: Sha["position"]) {
        if (this.values["position"] === v) return;

        this.values["position"] = v;
        this.node.setPositionType(
            v === "absolute" ? Yg.POSITION_TYPE_ABSOLUTE : Yg.POSITION_TYPE_RELATIVE,
        );

        this.scheduleRender({ layoutChange: true });
    }

    get display(): Sha["display"] {
        return this.values["display"];
    }
    get computedDisplay() {
        return this.node.getDisplay() === Yg.DISPLAY_FLEX ? "flex" : "none";
    }
    set display(v: Sha["display"]) {
        if (this.values["display"] === v) return;

        this.values["display"] = v;
        this.node.setDisplay(v === "none" ? Yg.DISPLAY_NONE : Yg.DISPLAY_FLEX);

        this.scheduleRender({ layoutChange: true });
    }

    get flexGrow(): Sha["flexGrow"] {
        return this.values["flexGrow"];
    }
    get computedFlexGrow() {
        return this.node.getFlexGrow();
    }
    set flexGrow(v: Sha["flexGrow"]) {
        if (this.values["flexGrow"] === v) return;
        this.values["flexGrow"] = v;

        this.node.setFlexGrow(v ?? 0);
        this.scheduleRender({ layoutChange: true });
    }

    get flexShrink(): Sha["flexShrink"] {
        return this.values["flexShrink"];
    }
    get computedFlexShrink() {
        return this.node.getFlexShrink();
    }
    set flexShrink(v: Sha["flexShrink"]) {
        if (this.values["flexShrink"] === v) return;
        this.values["flexShrink"] = v;

        this.node.setFlexShrink(v ?? 0);
        this.scheduleRender({ layoutChange: true });
    }

    get flexDirection(): Sha["flexDirection"] {
        return this.values["flexDirection"];
    }
    get computedFlexDirection(): Sha["flexDirection"] {
        const flexdir = this.node.getFlexDirection();
        return flexdir === Yg.FLEX_DIRECTION_ROW
            ? "row"
            : flexdir === Yg.FLEX_DIRECTION_COLUMN
              ? "column"
              : flexdir === Yg.FLEX_DIRECTION_ROW_REVERSE
                ? "row-reverse"
                : flexdir === Yg.FLEX_DIRECTION_COLUMN_REVERSE
                  ? "column-reverse"
                  : undefined;
    }
    set flexDirection(v: Sha["flexDirection"]) {
        if (this.values["flexDirection"] === v) return;
        this.values["flexDirection"] = v;

        if (v === "row") {
            this.node.setFlexDirection(Yg.FLEX_DIRECTION_ROW);
        } else if (v === "row-reverse") {
            this.node.setFlexDirection(Yg.FLEX_DIRECTION_ROW_REVERSE);
        } else if (v === "column") {
            this.node.setFlexDirection(Yg.FLEX_DIRECTION_COLUMN);
        } else if (v === "column-reverse") {
            this.node.setFlexDirection(Yg.FLEX_DIRECTION_COLUMN_REVERSE);
        }

        this.scheduleRender({ layoutChange: true });
    }

    get flexBasis(): Sha["flexBasis"] {
        return this.values["flexBasis"];
    }
    get computedFlexBasis() {
        return this.node.getFlexBasis();
    }
    set flexBasis(v: Sha["flexBasis"]) {
        if (this.values["flexBasis"] === v) return;
        this.values["flexBasis"] = v;

        if (typeof v === "number") {
            this.node.setFlexBasis(v);
        } else if (typeof v === "string") {
            this.node.setFlexBasisPercent(Number.parseInt(v, 10));
        } else {
            this.node.setFlexBasis(Number.NaN);
        }

        this.scheduleRender({ layoutChange: true });
    }

    get flexWrap(): Sha["flexWrap"] {
        return this.values["flexWrap"];
    }
    get computedFlexWrap(): Sha["flexWrap"] {
        const flexwrap = this.node.getFlexWrap();
        return flexwrap === Yg.WRAP_WRAP
            ? "wrap"
            : flexwrap === Yg.WRAP_NO_WRAP
              ? "nowrap"
              : flexwrap === Yg.WRAP_WRAP_REVERSE
                ? "wrap-reverse"
                : undefined;
    }
    set flexWrap(v: Sha["flexWrap"]) {
        if (this.values["flexWrap"] === v) return;
        this.values["flexWrap"] = v;

        if (v === "wrap") {
            this.node.setFlexWrap(Yg.WRAP_WRAP);
        } else if (v === "nowrap") {
            this.node.setFlexWrap(Yg.WRAP_NO_WRAP);
        } else if (v === "wrap-reverse") {
            this.node.setFlexWrap(Yg.WRAP_WRAP_REVERSE);
        }

        this.scheduleRender({ layoutChange: true });
    }

    get alignItems(): Sha["alignItems"] {
        return this.values["alignItems"];
    }
    set alignItems(v: Sha["alignItems"]) {
        if (this.values["alignItems"] === v) return;
        this.values["alignItems"] = v;

        if (v === "stretch" || !v) {
            this.node.setAlignItems(Yg.ALIGN_STRETCH);
        } else if (v === "flex-start") {
            this.node.setAlignItems(Yg.ALIGN_FLEX_START);
        } else if (v === "center") {
            this.node.setAlignItems(Yg.ALIGN_CENTER);
        } else if (v === "flex-end") {
            this.node.setAlignItems(Yg.ALIGN_FLEX_END);
        }

        this.scheduleRender({ layoutChange: true });
    }

    get alignSelf(): Sha["alignSelf"] {
        return this.values["alignSelf"];
    }
    set alignSelf(v: Sha["alignSelf"]) {
        if (this.values["alignSelf"] === v) return;
        this.values["alignSelf"] = v;

        if (!v) {
            this.node.setAlignSelf(Yg.ALIGN_AUTO);
        } else if (v === "flex-start") {
            this.node.setAlignSelf(Yg.ALIGN_FLEX_START);
        } else if (v === "flex-end") {
            this.node.setAlignSelf(Yg.ALIGN_FLEX_END);
        } else if (v === "center") {
            this.node.setAlignSelf(Yg.ALIGN_CENTER);
        }

        this.scheduleRender({ layoutChange: true });
    }

    get justifyContent(): Sha["justifyContent"] {
        return this.values["justifyContent"];
    }
    set justifyContent(v: Sha["justifyContent"]) {
        if (this.values["justifyContent"] === v) return;
        this.values["justifyContent"] = v;

        if (v === "flex-start" || !v) {
            this.node.setJustifyContent(Yg.JUSTIFY_FLEX_START);
        } else if (v === "flex-end") {
            this.node.setJustifyContent(Yg.JUSTIFY_FLEX_END);
        } else if (v === "center") {
            this.node.setJustifyContent(Yg.JUSTIFY_CENTER);
        } else if (v === "space-between") {
            this.node.setJustifyContent(Yg.JUSTIFY_SPACE_BETWEEN);
        } else if (v === "space-around") {
            this.node.setJustifyContent(Yg.JUSTIFY_SPACE_AROUND);
        } else if (v === "space-evenly") {
            this.node.setJustifyContent(Yg.JUSTIFY_SPACE_EVENLY);
        }

        this.scheduleRender({ layoutChange: true });
    }

    get columnGap(): Sha["columnGap"] {
        return this.values["columnGap"];
    }
    set columnGap(v: Sha["columnGap"]) {
        if (this.values["columnGap"] === v) return;
        this.values["columnGap"] = v;

        this.node.setGap(Yg.GUTTER_COLUMN, v ?? 0);
        this.scheduleRender({ layoutChange: true });
    }

    get rowGap(): Sha["rowGap"] {
        return this.values["rowGap"];
    }
    set rowGap(v: Sha["rowGap"]) {
        if (this.values["rowGap"] === v) return;
        this.values["rowGap"] = v;
        this.node.setGap(Yg.GUTTER_ROW, v ?? 0);
        this.scheduleRender({ layoutChange: true });
    }

    get zIndex(): Sha["zIndex"] {
        return this.values["zIndex"];
    }
    set zIndex(v: Sha["zIndex"]) {
        if (this.values["zIndex"] === v) return;
        this.values["zIndex"] = v;

        this.scheduleRender({ layoutChange: true });
    }

    get backgroundColor(): Sha["backgroundColor"] {
        return this.values["backgroundColor"];
    }
    set backgroundColor(v: Sha["backgroundColor"]) {
        if (this.values["backgroundColor"] === v) return;
        this.values["backgroundColor"] = v;
        this.scheduleRender({ styleChange: true });
    }

    get backgroundStyle(): Sha["backgroundStyle"] {
        return this.values["backgroundStyle"];
    }
    set backgroundStyle(v: Sha["backgroundStyle"]) {
        if (this.values["backgroundStyle"] === v) return;
        this.values["backgroundStyle"] = v;
        this.scheduleRender({ styleChange: true });
    }

    get backgroundStyleColor(): Sha["backgroundStyleColor"] {
        return this.values["backgroundStyleColor"];
    }
    set backgroundStyleColor(v: Sha["backgroundStyleColor"]) {
        if (this.values["backgroundStyleColor"] === v) return;
        this.values["backgroundStyleColor"] = v;
        this.scheduleRender({ styleChange: true });
    }

    get overflowX(): Sha["overflowX"] {
        return this.values["overflowX"];
    }
    set overflowX(v: Sha["overflowX"]) {
        if (this.values["overflowX"] === v) return;
        this.values["overflowX"] = v;
        this.scheduleRender({ layoutChange: true });
    }

    get overflowY(): Sha["overflowY"] {
        return this.values["overflowY"];
    }
    set overflowY(v: Sha["overflowY"]) {
        if (this.values["overflowY"] === v) return;
        this.values["overflowY"] = v;
        this.scheduleRender({ layoutChange: true });
    }

    get borderStyle(): Sha["borderStyle"] {
        return this.values["borderStyle"];
    }
    set borderStyle(v: Sha["borderStyle"]) {
        if (this.values["borderStyle"] === v) return;
        this.values["borderStyle"] = v;
        this.scheduleRender({ styleChange: true });
    }

    get borderTop(): Sha["borderTop"] {
        return this.values["borderTop"];
    }
    set borderTop(v: Sha["borderTop"]) {
        if (this.values["borderTop"] === v) return;
        this.values["borderTop"] = v;

        this.node.setBorder(
            Yg.EDGE_TOP,
            Math.max(v ? 1 : 0, this._scrollbarBorderTop ?? 0),
        );

        this.scheduleRender({ layoutChange: true });
    }

    get borderBottom(): Sha["borderBottom"] {
        return this.values["borderBottom"];
    }
    set borderBottom(v: Sha["borderBottom"]) {
        if (this.values["borderBottom"] === v) return;
        this.values["borderBottom"] = v;

        this.node.setBorder(
            Yg.EDGE_BOTTOM,
            Math.max(v ? 1 : 0, this._scrollbarBorderBottom ?? 0),
        );

        this.scheduleRender({ layoutChange: true });
    }

    get borderLeft(): Sha["borderLeft"] {
        return this.values["borderLeft"];
    }
    set borderLeft(v: Sha["borderLeft"]) {
        if (this.values["borderLeft"] === v) return;
        this.values["borderLeft"] = v;

        this.node.setBorder(
            Yg.EDGE_LEFT,
            Math.max(v ? 1 : 0, this._scrollbarBorderLeft ?? 0),
        );

        this.scheduleRender({ layoutChange: true });
    }

    get borderRight(): Sha["borderRight"] {
        return this.values["borderRight"];
    }
    set borderRight(v: Sha["borderRight"]) {
        if (this.values["borderRight"] === v) return;
        this.values["borderRight"] = v;

        this.node.setBorder(
            Yg.EDGE_RIGHT,
            Math.max(v ? 1 : 0, this._scrollbarBorderRight ?? 0),
        );

        this.scheduleRender({ layoutChange: true });
    }

    get borderColor(): Sha["borderColor"] {
        return this.values["borderColor"];
    }
    set borderColor(v: Sha["borderColor"]) {
        if (this.values["borderColor"] === v) return;
        this.values["borderColor"] = v;
        this.scheduleRender({ styleChange: true });
    }

    get borderTopColor(): Sha["borderTopColor"] {
        return this.values["borderTopColor"];
    }
    set borderTopColor(v: Sha["borderTopColor"]) {
        if (this.values["borderTopColor"] === v) return;
        this.values["borderTopColor"] = v;
        this.scheduleRender({ styleChange: true });
    }

    get borderBottomColor(): Sha["borderBottomColor"] {
        return this.values["borderBottomColor"];
    }
    set borderBottomColor(v: Sha["borderBottomColor"]) {
        if (this.values["borderBottomColor"] === v) return;
        this.values["borderBottomColor"] = v;
        this.scheduleRender({ styleChange: true });
    }

    get borderLeftColor(): Sha["borderLeftColor"] {
        return this.values["borderLeftColor"];
    }
    set borderLeftColor(v: Sha["borderLeftColor"]) {
        if (this.values["borderLeftColor"] === v) return;
        this.values["borderLeftColor"] = v;
        this.scheduleRender({ styleChange: true });
    }

    get borderRightColor(): Sha["borderRightColor"] {
        return this.values["borderRightColor"];
    }
    set borderRightColor(v: Sha["borderRightColor"]) {
        if (this.values["borderRightColor"] === v) return;
        this.values["borderRightColor"] = v;
        this.scheduleRender({ styleChange: true });
    }

    get borderDimColor(): Sha["borderDimColor"] {
        return this.values["borderDimColor"];
    }
    set borderDimColor(v: Sha["borderDimColor"]) {
        if (this.values["borderDimColor"] === v) return;
        this.values["borderDimColor"] = v;
        this.scheduleRender({ styleChange: true });
    }

    get borderTopDimColor(): Sha["borderTopDimColor"] {
        return this.values["borderTopDimColor"];
    }
    set borderTopDimColor(v: Sha["borderTopDimColor"]) {
        if (this.values["borderTopDimColor"] === v) return;
        this.values["borderTopDimColor"] = v;
        this.scheduleRender({ styleChange: true });
    }

    get borderBottomDimColor(): Sha["borderBottomDimColor"] {
        return this.values["borderBottomDimColor"];
    }
    set borderBottomDimColor(v: Sha["borderBottomDimColor"]) {
        if (this.values["borderBottomDimColor"] === v) return;
        this.values["borderBottomDimColor"] = v;
        this.scheduleRender({ styleChange: true });
    }

    get borderLeftDimColor(): Sha["borderLeftDimColor"] {
        return this.values["borderLeftDimColor"];
    }
    set borderLeftDimColor(v: Sha["borderLeftDimColor"]) {
        if (this.values["borderLeftDimColor"] === v) return;
        this.values["borderLeftDimColor"] = v;
        this.scheduleRender({ styleChange: true });
    }

    get borderRightDimColor(): Sha["borderRightDimColor"] {
        return this.values["borderRightDimColor"];
    }
    set borderRightDimColor(v: Sha["borderRightDimColor"]) {
        if (this.values["borderRightDimColor"] === v) return;
        this.values["borderRightDimColor"] = v;
        this.scheduleRender({ styleChange: true });
    }

    get _scrollbarPaddingLeft(): Sha["_scrollbarPaddingLeft"] {
        return this.values["_scrollbarPaddingLeft"];
    }
    set _scrollbarPaddingLeft(v: Sha["_scrollbarPaddingLeft"]) {
        if (this.values["_scrollbarPaddingLeft"] === v) return;
        this.values["_scrollbarPaddingLeft"] = v;

        this.node.setPadding(Yg.EDGE_LEFT, Math.max(v ?? 0, this.paddingLeft ?? 0));
        this.scheduleRender({ layoutChange: true });
    }

    get _scrollbarPaddingRight(): Sha["_scrollbarPaddingRight"] {
        return this.values["_scrollbarPaddingRight"];
    }
    set _scrollbarPaddingRight(v: Sha["_scrollbarPaddingRight"]) {
        if (this.values["_scrollbarPaddingRight"] === v) return;
        this.values["_scrollbarPaddingRight"] = v;

        this.node.setPadding(Yg.EDGE_RIGHT, Math.max(v ?? 0, this.paddingRight ?? 0));
        this.scheduleRender({ layoutChange: true });
    }

    get _scrollbarPaddingTop(): Sha["_scrollbarPaddingTop"] {
        return this.values["_scrollbarPaddingTop"];
    }
    set _scrollbarPaddingTop(v: Sha["_scrollbarPaddingTop"]) {
        if (this.values["_scrollbarPaddingTop"] === v) return;
        this.values["_scrollbarPaddingTop"] = v;
        this.node.setPadding(Yg.EDGE_TOP, Math.max(v ?? 0, this.paddingTop ?? 0));
        this.scheduleRender({ layoutChange: true });
    }

    get _scrollbarPaddingBottom(): Sha["_scrollbarPaddingBottom"] {
        return this.values["_scrollbarPaddingBottom"];
    }
    set _scrollbarPaddingBottom(v: Sha["_scrollbarPaddingBottom"]) {
        if (this.values["_scrollbarPaddingBottom"] === v) return;
        this.values["_scrollbarPaddingBottom"] = v;
        this.node.setPadding(Yg.EDGE_BOTTOM, Math.max(v ?? 0, this.paddingBottom ?? 0));
        this.scheduleRender({ layoutChange: true });
    }

    get _scrollbarBorderLeft(): Sha["_scrollbarBorderLeft"] {
        return this.values["_scrollbarBorderLeft"];
    }
    set _scrollbarBorderLeft(v: Sha["_scrollbarBorderLeft"]) {
        if (this.values["_scrollbarBorderLeft"] === v) return;
        this.values["_scrollbarBorderLeft"] = v;
        this.node.setBorder(Yg.EDGE_LEFT, Math.max(v ?? 0, this.borderLeft ? 1 : 0));
        this.scheduleRender({ layoutChange: true });
    }

    get _scrollbarBorderRight(): Sha["_scrollbarBorderRight"] {
        return this.values["_scrollbarBorderRight"];
    }
    set _scrollbarBorderRight(v: Sha["_scrollbarBorderRight"]) {
        if (this.values["_scrollbarBorderRight"] === v) return;
        this.values["_scrollbarBorderRight"] = v;
        this.node.setBorder(Yg.EDGE_RIGHT, Math.max(v ?? 0, this.borderRight ? 1 : 0));
        this.scheduleRender({ layoutChange: true });
    }

    get _scrollbarBorderTop(): Sha["_scrollbarBorderTop"] {
        return this.values["_scrollbarBorderTop"];
    }
    set _scrollbarBorderTop(v: Sha["_scrollbarBorderTop"]) {
        if (this.values["_scrollbarBorderTop"] === v) return;
        this.values["_scrollbarBorderTop"] = v;
        this.node.setBorder(Yg.EDGE_TOP, Math.max(v ?? 0, this.borderTop ? 1 : 0));
        this.scheduleRender({ layoutChange: true });
    }

    get _scrollbarBorderBottom(): Sha["_scrollbarBorderBottom"] {
        return this.values["_scrollbarBorderBottom"];
    }
    set _scrollbarBorderBottom(v: Sha["_scrollbarBorderBottom"]) {
        if (this.values["_scrollbarBorderBottom"] === v) return;
        this.values["_scrollbarBorderBottom"] = v;
        this.node.setBorder(Yg.EDGE_BOTTOM, Math.max(v ?? 0, this.borderBottom ? 1 : 0));
        this.scheduleRender({ layoutChange: true });
    }

    // ***** TEXT *****

    get color(): Sha["color"] {
        return this.values["color"];
    }
    set color(v: Sha["color"]) {
        if (this.values["color"] === v) return;
        this.values["color"] = v;
        this.scheduleRender({ styleChange: true });
    }

    // backgroundColor overlaps that of regular styles

    get dimColor(): Sha["dimColor"] {
        return this.values["dimColor"];
    }
    set dimColor(v: Sha["dimColor"]) {
        if (this.values["dimColor"] === v) return;
        this.values["dimColor"] = v;
        this.scheduleRender({ styleChange: true });
    }

    get bold(): Sha["bold"] {
        return this.values["bold"];
    }
    set bold(v: Sha["bold"]) {
        if (this.values["bold"] === v) return;
        this.values["bold"] = v;
        this.scheduleRender({ styleChange: true });
    }

    get italic(): Sha["italic"] {
        return this.values["italic"];
    }
    set italic(v: Sha["italic"]) {
        if (this.values["italic"] === v) return;
        this.values["italic"] = v;
        this.scheduleRender({ styleChange: true });
    }

    get underline(): Sha["underline"] {
        return this.values["underline"];
    }
    set underline(v: Sha["underline"]) {
        if (this.values["underline"] === v) return;
        this.values["underline"] = v;
        this.scheduleRender({ styleChange: true });
    }

    get strikethrough(): Sha["strikethrough"] {
        return this.values["strikethrough"];
    }
    set strikethrough(v: Sha["strikethrough"]) {
        if (this.values["strikethrough"] === v) return;
        this.values["strikethrough"] = v;
        this.scheduleRender({ styleChange: true });
    }

    get wrap(): Sha["wrap"] {
        return this.values["wrap"];
    }
    /** todo - this should also trigger the measureFunc to run on TextElements */
    set wrap(v: Sha["wrap"]) {
        if (this.values["wrap"] === v) return;
        this.values["wrap"] = v;
        this.scheduleRender({ layoutChange: true });
    }

    get align(): Sha["align"] {
        return this.values["align"];
    }
    set align(v: Sha["align"]) {
        if (this.values["align"] === v) return;
        this.values["align"] = v;
        this.scheduleRender({ styleChange: true });
    }

    get imagePositive(): Sha["imagePositive"] {
        return this.values["imagePositive"];
    }
    set imagePositive(v: Sha["imagePositive"]) {
        if (this.values["imagePositive"] === v) return;
        this.values["imagePositive"] = v;
        this.scheduleRender({ styleChange: true });
    }

    get imageNegative(): Sha["imageNegative"] {
        return this.values["imageNegative"];
    }
    set imageNegative(v: Sha["imageNegative"]) {
        if (this.values["imageNegative"] === v) return;
        this.values["imageNegative"] = v;
        this.scheduleRender({ styleChange: true });
    }

    get fontDefault(): Sha["fontDefault"] {
        return this.values["fontDefault"];
    }
    set fontDefault(v: Sha["fontDefault"]) {
        if (this.values["fontDefault"] === v) return;
        this.values["fontDefault"] = v;
        this.scheduleRender({ styleChange: true });
    }

    get font1(): Sha["font1"] {
        return this.values["font1"];
    }
    set font1(v: Sha["font1"]) {
        if (this.values["font1"] === v) return;
        this.values["font1"] = v;
        this.scheduleRender({ styleChange: true });
    }

    get font2(): Sha["font2"] {
        return this.values["font2"];
    }
    set font2(v: Sha["font2"]) {
        if (this.values["font2"] === v) return;
        this.values["font2"] = v;
        this.scheduleRender({ styleChange: true });
    }

    get font3(): Sha["font3"] {
        return this.values["font3"];
    }
    set font3(v: Sha["font3"]) {
        if (this.values["font3"] === v) return;
        this.values["font3"] = v;
        this.scheduleRender({ styleChange: true });
    }

    get font4(): Sha["font4"] {
        return this.values["font4"];
    }
    set font4(v: Sha["font4"]) {
        if (this.values["font4"] === v) return;
        this.values["font4"] = v;
        this.scheduleRender({ styleChange: true });
    }

    get font5(): Sha["font5"] {
        return this.values["font5"];
    }
    set font5(v: Sha["font5"]) {
        if (this.values["font5"] === v) return;
        this.values["font5"] = v;
        this.scheduleRender({ styleChange: true });
    }

    get font6(): Sha["font6"] {
        return this.values["font6"];
    }
    set font6(v: Sha["font6"]) {
        if (this.values["font6"] === v) return;
        this.values["font6"] = v;
        this.scheduleRender({ styleChange: true });
    }
}
