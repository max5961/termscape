import { MinusInherit, RStyle, VStyle } from "./Style.js";
import { parseDimensions } from "./util.js";

// Should we prune undefined from RStyle?
// Reflects what the has been explcitly touched.  Sanitized data is passed to the
// real layer which triggers renders on diffs and represents the view.  This should
// make rendering easier.  For example, if a borderColor is set, the real layer sets
// borderColor which doesn't set borderColor at all, only border<Edge>Color.  Likewise
// for overflow, the real style overflow is never set, only overflowX and overflowY

export const SanitizeVirtualStyles: {
    [P in keyof MinusInherit<VStyle>]: (
        newVal: MinusInherit<VStyle>[P],
        stdout: NodeJS.WriteStream,
    ) => RStyle[P];
} = {
    // =========================================================================
    // DIMENSIONS
    // =========================================================================
    height(newVal, stdout) {
        return parseDimensions(newVal, stdout, "vh");
    },
    width(newVal, stdout) {
        return parseDimensions(newVal, stdout, "vw");
    },
    minHeight(newVal, stdout) {
        return parseDimensions(newVal, stdout, "vh");
    },
    minWidth(newVal, stdout) {
        return parseDimensions(newVal, stdout, "vw");
    },

    // zIndex is an example of a `real style` value that cannot be undefined, so
    // this is not type safe unless we define zIndex as explicitly not being
    // able to be undefined as a real style
    zIndex(newVal, _stdout) {
        return typeof newVal === "string" ? 0 : newVal ?? 0;
    },
    overflow(newVal, _stdout) {
        return newVal ?? "visible";
    },
    overflowX(newVal, _stdout) {
        return newVal ?? "visible";
    },
    overflowY(newVal, _stdout) {
        return newVal ?? "visible";
    },
};
