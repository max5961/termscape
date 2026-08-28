import { Yg } from "../../Constants.js";
import type { YogaNode } from "../../Types.js";
import type { Kernel } from "../Kernel.js";
import type { IShadowStyle } from "./Style.js";

export class ShadowStyle implements IShadowStyle {
    private kernel: Kernel;
    private yogaNode: YogaNode;
    private values: Partial<IShadowStyle>;

    constructor(kernel: Kernel) {
        this.kernel = kernel;
        this.yogaNode = kernel.yogaNode;
        this.values = {};
    }

    private resolveDimension(dim: string | number | undefined) {
        if (typeof dim !== "string") return dim;
        dim = dim.trimEnd();
        const vh = dim.endsWith("vh");
        const vw = dim.endsWith("vw");
        const stdout = this.kernel.root.stdout;
        if (vh || vw) {
            const pct = Number.parseInt(dim, 10) / 100;
            const stdoutDim = vh ? stdout.rows : stdout.columns;
            return Math.round(stdoutDim * pct);
        }
        return dim;
    }

    get height() {
        return this.values.height;
    }
    set height(v) {
        const resolved = this.resolveDimension(v);
        if (this.values.height === v) return;
        this.values.height = resolved;

        if (typeof resolved === "number") {
            this.yogaNode.setHeight(resolved);
        } else if (typeof resolved === "string") {
            this.yogaNode.setHeightPercent(Number.parseInt(resolved, 10));
        } else {
            this.yogaNode.setHeightAuto();
        }

        this.kernel.root.scheduleRender();
    }

    get width() {
        return this.values.width;
    }
    set width(v) {
        const resolved = this.resolveDimension(v);
        if (this.values.width === v) return;
        this.values.width = resolved;

        if (typeof resolved === "number") {
            this.yogaNode.setWidth(resolved);
        } else if (typeof resolved === "string") {
            this.yogaNode.setWidthPercent(Number.parseInt(resolved, 10));
        } else {
            this.yogaNode.setWidthAuto();
        }

        this.kernel.root.scheduleRender();
    }

    get minHeight() {
        return this.values.minHeight;
    }
    set minHeight(v) {
        const resolved = this.resolveDimension(v);
        if (this.values.minHeight === v) return;
        this.values.minHeight = resolved;

        if (typeof resolved === "string") {
            this.yogaNode.setMinHeightPercent(Number.parseInt(resolved, 10));
        } else {
            this.yogaNode.setMinHeight(resolved ?? 0);
        }

        this.kernel.root.scheduleRender();
    }

    get minWidth() {
        return this.values.minWidth;
    }
    set minWidth(v) {
        const resolved = this.resolveDimension(v);
        if (this.values.minWidth === v) return;
        this.values.minWidth = resolved;

        if (typeof resolved === "string") {
            this.yogaNode.setMinWidthPercent(Number.parseInt(resolved, 10));
        } else {
            this.yogaNode.setMinWidth(resolved ?? 0);
        }

        this.kernel.root.scheduleRender();
    }

    get marginTop() {
        return this.values.marginTop;
    }
    get computedMarginTop() {
        return this.yogaNode.getComputedMargin(Yg.EDGE_TOP);
    }
    set marginTop(v) {
        if (this.values.marginTop === v) return;

        this.values.marginTop = v;
        this.yogaNode.setMargin(Yg.EDGE_TOP, v ?? 0);

        this.kernel.root.scheduleRender();
    }

    get marginBottom() {
        return this.values.marginBottom;
    }
    get computedMarginBottom() {
        return this.yogaNode.getComputedMargin(Yg.EDGE_BOTTOM);
    }
    set marginBottom(v) {
        if (this.values.marginBottom === v) return;

        this.values.marginBottom = v;
        this.yogaNode.setMargin(Yg.EDGE_BOTTOM, v ?? 0);

        this.kernel.root.scheduleRender();
    }

    get marginLeft() {
        return this.values.marginLeft;
    }
    get computedMarginLeft() {
        return this.yogaNode.getComputedMargin(Yg.EDGE_LEFT);
    }
    set marginLeft(v) {
        if (this.values.marginLeft === v) return;

        this.values.marginLeft = v;
        this.yogaNode.setMargin(Yg.EDGE_LEFT, v ?? 0);

        this.kernel.root.scheduleRender();
    }

    get marginRight() {
        return this.values.marginRight;
    }
    get computedMarginRight() {
        return this.yogaNode.getComputedMargin(Yg.EDGE_RIGHT);
    }
    set marginRight(v) {
        if (this.values.marginRight === v) return;

        this.values.marginRight = v;
        this.yogaNode.setMargin(Yg.EDGE_RIGHT, v ?? 0);

        this.kernel.root.scheduleRender();
    }

    get paddingTop() {
        return this.values.paddingTop;
    }
    get computedPaddingTop() {
        return this.yogaNode.getComputedPadding(Yg.EDGE_TOP);
    }
    set paddingTop(v) {
        if (this.values.paddingTop === v) return;

        this.values.paddingTop = v;
        this.yogaNode.setPadding(Yg.EDGE_TOP, v ?? 0);

        this.kernel.root.scheduleRender();
    }

    get paddingBottom() {
        return this.values.paddingBottom;
    }
    get computedPaddingBottom() {
        return this.yogaNode.getComputedPadding(Yg.EDGE_BOTTOM);
    }
    set paddingBottom(v) {
        if (this.values.paddingBottom === v) return;

        this.values.paddingBottom = v;
        this.yogaNode.setPadding(Yg.EDGE_BOTTOM, v ?? 0);

        this.kernel.root.scheduleRender();
    }

    get paddingLeft() {
        return this.values.paddingLeft;
    }
    get computedPaddingLeft() {
        return this.yogaNode.getComputedPadding(Yg.EDGE_LEFT);
    }
    set paddingLeft(v) {
        if (this.values.paddingLeft === v) return;

        this.values.paddingLeft = v;
        this.yogaNode.setPadding(Yg.EDGE_LEFT, v ?? 0);

        this.kernel.root.scheduleRender();
    }

    get paddingRight() {
        return this.values.paddingRight;
    }
    get computedPaddingRight() {
        return this.yogaNode.getComputedPadding(Yg.EDGE_RIGHT);
    }
    set paddingRight(v) {
        if (this.values.paddingRight === v) return;

        this.values.paddingRight = v;
        this.yogaNode.setPadding(Yg.EDGE_RIGHT, v ?? 0);

        this.kernel.root.scheduleRender();
    }

    get position() {
        return this.values.position;
    }
    set position(v) {
        if (this.values.position === v) return;

        this.values.position = v;
        this.yogaNode.setPositionType(
            v === "absolute" ? Yg.POSITION_TYPE_ABSOLUTE : Yg.POSITION_TYPE_RELATIVE,
        );

        this.kernel.root.scheduleRender();
    }

    get display() {
        return this.values.display;
    }
    get computedDisplay() {
        return this.yogaNode.getDisplay() === Yg.DISPLAY_FLEX ? "flex" : "none";
    }
    set display(v) {
        if (this.values.display === v) return;

        this.values.display = v;
        this.yogaNode.setDisplay(v === "flex" ? Yg.DISPLAY_FLEX : Yg.DISPLAY_NONE);

        this.kernel.root.scheduleRender();
    }

    get flexGrow() {
        return this.values.flexGrow;
    }
    get computedFlexGrow() {
        return this.yogaNode.getFlexGrow();
    }
    set flexGrow(v) {
        if (this.values.flexGrow === v) return;

        this.values.flexGrow = v;
        this.yogaNode.setFlexGrow(v ?? 0);

        this.kernel.root.scheduleRender();
    }

    get flexShrink() {
        return this.values.flexShrink;
    }
    get computedFlexShrink() {
        return this.yogaNode.getFlexShrink();
    }
    set flexShrink(v) {
        /** IMPORTANT - need to handle blocking flex shrink here if set */
        if (this.values.flexShrink === v) return;

        this.values.flexShrink = v;
        this.yogaNode.setFlexShrink(v ?? 0);

        this.kernel.root.scheduleRender();
    }

    get flexDirection() {
        return this.values.flexDirection;
    }
    get computedFlexDirection() {
        const fd = this.yogaNode.getFlexDirection();
        return fd === Yg.FLEX_DIRECTION_ROW
            ? "row"
            : fd === Yg.FLEX_DIRECTION_COLUMN
              ? "column"
              : fd === Yg.FLEX_DIRECTION_ROW_REVERSE
                ? "row-reverse"
                : fd === Yg.FLEX_DIRECTION_COLUMN_REVERSE
                  ? "column-reverse"
                  : undefined;
    }
    set flexDirection(v) {
        if (this.values.flexDirection === v) return;
        this.values.flexDirection = v;

        if (v === "row") {
            this.yogaNode.setFlexDirection(Yg.FLEX_DIRECTION_ROW);
        } else if (v === "row-reverse") {
            this.yogaNode.setFlexDirection(Yg.FLEX_DIRECTION_ROW_REVERSE);
        } else if (v === "column") {
            this.yogaNode.setFlexDirection(Yg.FLEX_DIRECTION_COLUMN);
        } else if (v === "column-reverse") {
            this.yogaNode.setFlexDirection(Yg.FLEX_DIRECTION_COLUMN_REVERSE);
        }

        this.kernel.root.scheduleRender();
    }

    get flexBasis() {
        return this.values.flexBasis;
    }
    get computedFlexBasis() {
        return this.yogaNode.getFlexBasis();
    }
    set flexBasis(v) {
        if (this.values.flexBasis === v) return;
        this.values.flexBasis = v;

        if (typeof v === "number") {
            this.yogaNode.setFlexBasis(v);
        } else if (typeof v === "string") {
            this.yogaNode.setFlexBasisPercent(Number.parseInt(v, 10));
        } else {
            this.yogaNode.setFlexBasis(Number.NaN);
        }

        this.kernel.root.scheduleRender();
    }

    get flexWrap() {
        return this.values.flexWrap;
    }
    get computedFlexWrap() {
        const fw = this.yogaNode.getFlexWrap();
        return fw === Yg.WRAP_WRAP
            ? "wrap"
            : fw === Yg.WRAP_NO_WRAP
              ? "nowrap"
              : fw === Yg.WRAP_WRAP_REVERSE
                ? "wrap-reverse"
                : undefined;
    }
    set flexWrap(v) {
        if (this.values.flexWrap === v) return;
        this.values.flexWrap = v;

        if (v === "wrap") {
            this.yogaNode.setFlexWrap(Yg.WRAP_WRAP);
        } else if (v === "nowrap") {
            this.yogaNode.setFlexWrap(Yg.WRAP_NO_WRAP);
        } else if (v === "wrap-reverse") {
            this.yogaNode.setFlexWrap(Yg.WRAP_WRAP_REVERSE);
        }

        this.kernel.root.scheduleRender();
    }

    get alignItems() {
        return this.values.alignItems;
    }
    get computedAlignItems(): IShadowStyle["alignItems"] {
        const v = this.yogaNode.getAlignItems();
        if (v === Yg.ALIGN_STRETCH) {
            return "stretch";
        } else if (v === Yg.ALIGN_FLEX_START) {
            return "flex-start";
        } else if (v === Yg.ALIGN_CENTER) {
            return "center";
        } else if (v === Yg.ALIGN_FLEX_END) {
            return "flex-end";
        } else {
            return undefined;
        }
    }
    set alignItems(v) {
        if (this.values.alignItems === v) return;
        this.values.alignItems = v;

        if (v === "stretch" || !v) {
            this.yogaNode.setAlignItems(Yg.ALIGN_STRETCH);
        } else if (v === "flex-start") {
            this.yogaNode.setAlignItems(Yg.ALIGN_FLEX_START);
        } else if (v === "center") {
            this.yogaNode.setAlignItems(Yg.ALIGN_CENTER);
        } else if (v === "flex-end") {
            this.yogaNode.setAlignItems(Yg.ALIGN_FLEX_END);
        }

        this.kernel.root.scheduleRender();
    }

    get alignSelf() {
        return this.values.alignSelf;
    }
    get computedAlignSelf() {
        // todo
        return this.yogaNode.getAlignSelf();
    }
    set alignSelf(v) {
        if (this.values.alignSelf === v) return;
        this.values.alignSelf = v;

        if (!v) {
            this.yogaNode.setAlignSelf(Yg.ALIGN_AUTO);
        } else if (v === "flex-start") {
            this.yogaNode.setAlignSelf(Yg.ALIGN_FLEX_START);
        } else if (v === "flex-end") {
            this.yogaNode.setAlignSelf(Yg.ALIGN_FLEX_END);
        } else if (v === "center") {
            this.yogaNode.setAlignSelf(Yg.ALIGN_CENTER);
        }

        this.kernel.root.scheduleRender();
    }

    get justifyContent() {
        return this.values.justifyContent;
    }
    get computedJustifyContent() {
        // todo
        return this.yogaNode.getJustifyContent();
    }
    set justifyContent(v) {
        if (this.values.justifyContent === v) return;
        this.values.justifyContent = v;

        if (v === "flex-start" || !v) {
            this.yogaNode.setJustifyContent(Yg.JUSTIFY_FLEX_START);
        } else if (v === "flex-end") {
            this.yogaNode.setJustifyContent(Yg.JUSTIFY_FLEX_END);
        } else if (v === "center") {
            this.yogaNode.setJustifyContent(Yg.JUSTIFY_CENTER);
        } else if (v === "space-between") {
            this.yogaNode.setJustifyContent(Yg.JUSTIFY_SPACE_BETWEEN);
        } else if (v === "space-around") {
            this.yogaNode.setJustifyContent(Yg.JUSTIFY_SPACE_AROUND);
        } else if (v === "space-evenly") {
            this.yogaNode.setJustifyContent(Yg.JUSTIFY_SPACE_EVENLY);
        }

        this.kernel.root.scheduleRender();
    }

    get columnGap() {
        return this.values.columnGap;
    }
    get computedColumnGap() {
        // todo fix return type
        return this.yogaNode.getGap(Yg.GUTTER_COLUMN);
    }
    set columnGap(v) {
        if (this.values.columnGap === v) return;
        this.values.columnGap = v;

        this.yogaNode.setGap(Yg.GUTTER_COLUMN, v ?? 0);
        this.kernel.root.scheduleRender();
    }

    get rowGap() {
        return this.values.rowGap;
    }
    get computedRowGap() {
        // todo fix return type
        return this.yogaNode.getGap(Yg.GUTTER_ROW);
    }
    set rowGap(v) {
        if (this.values.rowGap === v) return;
        this.values.rowGap = v;

        this.yogaNode.setGap(Yg.GUTTER_ROW, v ?? 0);
        this.kernel.root.scheduleRender();
    }

    get zIndex() {
        return this.values.zIndex;
    }
    set zIndex(v) {
        if (this.values.zIndex === v) return;
        this.values.zIndex = v;

        this.kernel.root.scheduleRender();
    }

    get backgroundColor() {
        return this.values.backgroundColor;
    }
    set backgroundColor(v) {
        if (this.values.backgroundColor === v) return;
        this.values.backgroundColor = v;
        this.kernel.root.scheduleRender();
    }

    get backgroundStyle() {
        return this.values.backgroundStyle;
    }
    set backgroundStyle(v) {
        if (this.values.backgroundStyle === v) return;
        this.values.backgroundStyle = v;
        this.kernel.root.scheduleRender();
    }

    get backgroundStyleColor() {
        return this.values.backgroundStyleColor;
    }
    set backgroundStyleColor(v) {
        if (this.values.backgroundStyleColor === v) return;
        this.values.backgroundStyleColor = v;
        this.kernel.root.scheduleRender();
    }

    get overflowX() {
        return this.values.overflowX;
    }
    set overflowX(v) {
        if (this.values.overflowX === v) return;
        this.values.overflowX = v;
        this.kernel.root.scheduleRender();
    }

    get overflowY() {
        return this.values.overflowY;
    }
    set overflowY(v) {
        if (this.values.overflowY === v) return;
        this.values.overflowY = v;
        this.kernel.root.scheduleRender();
    }

    get borderStyle() {
        return this.values.borderStyle;
    }
    set borderStyle(v) {
        if (this.values.borderStyle === v) return;
        this.values.borderStyle = v;
        this.kernel.root.scheduleRender();
    }

    get borderTop() {
        return this.values.borderTop;
    }
    set borderTop(v) {
        if (this.values.borderTop === v) return;
        this.values.borderTop = v;

        this.yogaNode.setBorder(Yg.EDGE_TOP, 1);
        this.kernel.root.scheduleRender();
    }

    get borderBottom() {
        return this.values.borderBottom;
    }
    set borderBottom(v) {
        if (this.values.borderBottom === v) return;
        this.values.borderBottom = v;

        this.yogaNode.setBorder(Yg.EDGE_BOTTOM, 1);
        this.kernel.root.scheduleRender();
    }

    get borderLeft() {
        return this.values.borderLeft;
    }
    set borderLeft(v) {
        if (this.values.borderLeft === v) return;
        this.values.borderLeft = v;

        this.yogaNode.setBorder(Yg.EDGE_LEFT, 1);
        this.kernel.root.scheduleRender();
    }

    get borderRight() {
        return this.values.borderRight;
    }
    set borderRight(v) {
        if (this.values.borderRight === v) return;
        this.values.borderRight = v;

        this.yogaNode.setBorder(Yg.EDGE_RIGHT, 1);
        this.kernel.root.scheduleRender();
    }

    get borderTopColor() {
        return this.values.borderTopColor;
    }
    set borderTopColor(v) {
        if (this.values.borderTopColor === v) return;
        this.values.borderTopColor = v;
        this.kernel.root.scheduleRender();
    }

    get borderBottomColor() {
        return this.values.borderBottomColor;
    }
    set borderBottomColor(v) {
        if (this.values.borderBottomColor === v) return;
        this.values.borderBottomColor = v;
        this.kernel.root.scheduleRender();
    }

    get borderLeftColor() {
        return this.values.borderLeftColor;
    }
    set borderLeftColor(v) {
        if (this.values.borderLeftColor === v) return;
        this.values.borderLeftColor = v;
        this.kernel.root.scheduleRender();
    }

    get borderRightColor() {
        return this.values.borderRightColor;
    }
    set borderRightColor(v) {
        if (this.values.borderRightColor === v) return;
        this.values.borderRightColor = v;
        this.kernel.root.scheduleRender();
    }

    get borderTopDimColor() {
        return this.values.borderTopDimColor;
    }
    set borderTopDimColor(v) {
        if (this.values.borderTopDimColor === v) return;
        this.values.borderTopDimColor = v;
        this.kernel.root.scheduleRender();
    }

    get borderBottomDimColor() {
        return this.values.borderBottomDimColor;
    }
    set borderBottomDimColor(v) {
        if (this.values.borderBottomDimColor === v) return;
        this.values.borderBottomDimColor = v;
        this.kernel.root.scheduleRender();
    }

    get borderLeftDimColor() {
        return this.values.borderLeftDimColor;
    }
    set borderLeftDimColor(v) {
        if (this.values.borderLeftDimColor === v) return;
        this.values.borderLeftDimColor = v;
        this.kernel.root.scheduleRender();
    }

    get borderRightDimColor() {
        return this.values.borderRightDimColor;
    }
    set borderRightDimColor(v) {
        if (this.values.borderRightDimColor === v) return;
        this.values.borderRightDimColor = v;
        this.kernel.root.scheduleRender();
    }

    get color() {
        return this.values.color;
    }
    set color(v) {
        if (this.values.color === v) return;
        this.values.color = v;
        this.kernel.root.scheduleRender();
    }

    get dimColor() {
        return this.values.dimColor;
    }
    set dimColor(v) {
        if (this.values.dimColor === v) return;
        this.values.dimColor = v;
        this.kernel.root.scheduleRender();
    }

    get bold() {
        return this.values.bold;
    }
    set bold(v) {
        if (this.values.bold === v) return;
        this.values.bold = v;
        this.kernel.root.scheduleRender();
    }

    get italic() {
        return this.values.italic;
    }
    set italic(v) {
        if (this.values.italic === v) return;
        this.values.italic = v;
        this.kernel.root.scheduleRender();
    }

    get underline() {
        return this.values.underline;
    }
    set underline(v) {
        if (this.values.underline === v) return;
        this.values.underline = v;
        this.kernel.root.scheduleRender();
    }

    get strikethrough() {
        return this.values.strikethrough;
    }
    set strikethrough(v) {
        if (this.values.strikethrough === v) return;
        this.values.strikethrough = v;
        this.kernel.root.scheduleRender();
    }

    get wrap() {
        return this.values.wrap;
    }
    set wrap(v) {
        if (this.values.wrap === v) return;
        this.values.wrap = v;
        this.kernel.root.scheduleRender();
    }

    get align() {
        return this.values.align;
    }
    set align(v) {
        if (this.values.align === v) return;
        this.values.align = v;
        this.kernel.root.scheduleRender();
    }

    get imagePositive() {
        return this.values.imagePositive;
    }
    set imagePositive(v) {
        if (this.values.imagePositive === v) return;
        this.values.imagePositive = v;
        this.kernel.root.scheduleRender();
    }

    get imageNegative() {
        return this.values.imageNegative;
    }
    set imageNegative(v) {
        if (this.values.imageNegative === v) return;
        this.values.imageNegative = v;
        this.kernel.root.scheduleRender();
    }

    get fontDefault() {
        return this.values.fontDefault;
    }
    set fontDefault(v) {
        if (this.values.fontDefault === v) return;
        this.values.fontDefault = v;
        this.kernel.root.scheduleRender();
    }

    get font1() {
        return this.values.font1;
    }
    set font1(v) {
        if (this.values.font1 === v) return;
        this.values.font1 = v;
        this.kernel.root.scheduleRender();
    }

    get font2() {
        return this.values.font2;
    }
    set font2(v) {
        if (this.values.font2 === v) return;
        this.values.font2 = v;
        this.kernel.root.scheduleRender();
    }

    get font3() {
        return this.values.font3;
    }
    set font3(v) {
        if (this.values.font3 === v) return;
        this.values.font3 = v;
        this.kernel.root.scheduleRender();
    }

    get font4() {
        return this.values.font4;
    }
    set font4(v) {
        if (this.values.font4 === v) return;
        this.values.font4 = v;
        this.kernel.root.scheduleRender();
    }

    get font5() {
        return this.values.font5;
    }
    set font5(v) {
        if (this.values.font5 === v) return;
        this.values.font5 = v;
        this.kernel.root.scheduleRender();
    }

    get font6() {
        return this.values.font6;
    }
    set font6(v) {
        if (this.values.font6 === v) return;
        this.values.font6 = v;
        this.kernel.root.scheduleRender();
    }
}
