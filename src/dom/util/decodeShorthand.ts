export const decodeShorthand = <T>(val: T | T[]) => {
    let top: T;
    let right: T;
    let bottom: T;
    let left: T;

    if (!Array.isArray(val)) {
        top = right = bottom = left = val;
    } else {
        [top, right, bottom, left] = val;
        right ??= top;
        bottom ??= top;
        left ??= right;
    }

    return [top, right, bottom, left];
};
