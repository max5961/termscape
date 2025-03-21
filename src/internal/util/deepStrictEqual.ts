export function deepStrictEqual(a: unknown, b: unknown): boolean {
    if (typeof a === "object" && typeof b === "object") {
        if (Array.isArray(a) && Array.isArray(b)) {
            return deepStrictEqualArrays(a, b);
        }

        if (Array.isArray(a) || Array.isArray(b)) {
            return false;
        }

        // To be safe (and keep things simple), classes are always unequal
        if (isClassInstance(a) || isClassInstance(b)) {
            return false;
        }

        return deepStrictEqualObjects(
            a as Record<string, unknown> | null,
            b as Record<string, unknown> | null,
        );
    }

    // strings, numbers, null, undefined, boolean, functions
    return a === b;
}

function deepStrictEqualObjects(
    a: Record<string, unknown> | null,
    b: Record<string, unknown> | null,
): boolean {
    if (a === null && b === null) return true;
    if (a === null || b === null) return false;
    if (Object.keys(a).length !== Object.keys(b).length) return false;

    for (const aKey of Object.keys(a)) {
        // Nonmatching keys
        if (!Object.hasOwn(b, aKey)) return false;
        // Matching values
        if (a[aKey] === b[aKey]) continue;

        const isEqual = deepStrictEqual(a[aKey], b[aKey]);
        if (!isEqual) return false;
    }

    return true;
}

function deepStrictEqualArrays(a: any[], b: any[]): boolean {
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; ++i) {
        const isEqual = deepStrictEqual(a[i], b[i]);
        if (!isEqual) return false;
    }

    return true;
}

function isClassInstance(obj: unknown): boolean {
    return (
        typeof obj === "object" &&
        obj !== null &&
        Object.getPrototypeOf(obj) !== Object.prototype
    );
}
