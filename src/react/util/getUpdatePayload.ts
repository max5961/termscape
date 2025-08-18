type Obj = Record<string, unknown>;

const validObjKeys = new Set([
    "props",
    "metadata",
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

/*
 * Used during prepareUpdate to diff the prev and next props. Returns null if
 * nothing has changed or else returns the update payload.  Handles recursion on
 * valid keys because the payload/intrinsic element props contain 2 obj keys.
 * 'props' key is for props for the exposed component and the 'metadata' key is
 * for encapsulated data from the wrapper fn body
 * */
export function getUpdatePayload(prev: Obj, next: Obj): Obj | null {
    if (prev === next) return null;
    if (!prev) return next || null;
    if (!next && !Object.keys(prev).length) return {};
    prev = prev ?? {};
    next = next ?? {};

    let mod: Obj | null = null;
    const final: Obj = {};

    for (const key of Object.keys(prev)) {
        if (!Object.hasOwn(next, key)) {
            // Handle **remove** nested obj prop in next
            if (validObjKeys.has(key)) {
                final[key] = getUpdatePayload(prev[key] as Obj, {} as Obj);
            } else {
                final[key] = undefined;
            }
            mod = final;
        }

        // Do not check for strict equality here, will check recursively later
        if (!validObjKeys.has(key) && prev[key] !== next[key]) {
            mod = final;
        }
    }

    if (next) {
        for (const key of Object.keys(next)) {
            // Handle **add** nested obj prop in next
            if (
                validObjKeys.has(key) &&
                !Array.isArray(next[key]) &&
                next[key] &&
                typeof next[key] === "object"
            ) {
                // prettier-ignore
                const nestedDiff = getUpdatePayload(prev[key] as Obj, next[key] as Obj);
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
