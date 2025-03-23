type TObject = Record<string, unknown>;

const objectProps = new Set([
    "style",
    "titleTopLeft",
    "titleTopCenter",
    "titleTopRight",
    "titleBottomLeft",
    "titleBottomCenter",
    "titleBottomRight",
    "borderStyle",
    "scrollbar",
]);

// internalDiff needs to be able to handle 1 level of recursion but not more and only for
// certain props such as the style prop.
export function internalDiff(prev: TObject, next: TObject, level = 0): TObject | null {
    if (prev === next) return null;
    if (!prev) return next || null;
    if (!next && !Object.keys(prev).length) return {};
    prev = prev ?? {};
    next = next ?? {};

    let mod: TObject | null = null;
    const final: TObject = {};

    for (const key of Object.keys(prev)) {
        if (!Object.hasOwn(next, key)) {
            // Handle **remove** nested obj prop in next
            if (level === 0 && objectProps.has(key)) {
                final[key] = internalDiff(prev[key] as TObject, {} as TObject);
            } else {
                final[key] = undefined;
            }
            mod = final;
        }

        // Do not check for strict equality on certain known object based props
        // We will recursively for that
        if (!objectProps.has(key) && prev[key] !== next[key]) {
            mod = final;
        }
    }

    if (next) {
        for (const key of Object.keys(next)) {
            // Handle **add** nested obj prop in next
            if (
                level === 0 &&
                objectProps.has(key) &&
                next[key] &&
                typeof next[key] === "object"
            ) {
                // prettier-ignore
                const nestedDiff = internalDiff(prev[key] as TObject, next[key] as TObject, ++level);
                if (nestedDiff) {
                    final[key] = nestedDiff;
                    mod = final;
                    continue;
                }
            } else if (prev[key] !== next[key]) {
                mod = final;
            }

            final[key] = next[key];
        }
    }

    return mod;
}
