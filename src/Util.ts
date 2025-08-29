type Enum<T extends string> = { [P in T]: T };

export function stringEnum<T extends string>(...p: T[]): Readonly<Enum<T>> {
    const result = {} as Enum<T>;

    for (let i = 0; i < p.length; ++i) {
        result[p[i]] = p[i];
    }

    return result;
}

export function objectKeys<T extends object>(obj: T) {
    return Object.keys(obj) as (keyof T)[];
}

export function objectEntries<T extends object>(obj: T) {
    return Object.entries(obj) as [keyof T, T[keyof T]][];
}

/**
 * The cb function returns the `fallback` if the `val` contains any of the defined
 * `invalid` values.
 *
 * Allows the fallback to be invalid, so it does not gaurantee the result to be
 * *not part of* the invalid array.
 * */
export const neverThese =
    <U>(invalid: readonly U[]) =>
    <T>(val: T | U, fallback: T): Exclude<T, U> | undefined => {
        if (invalid.includes(val as unknown as U)) {
            return fallback as Exclude<T, U> | undefined;
        }
        return val as Exclude<T, U> | undefined;
    };

/**
 * Returns the fallback if `val` is `undefined`.
 *
 * Why not not use `??` over this fn? Because setting values to `null` should
 * explicitly *unset* them, whereas if they were undefined the renderer would
 * have no way of knowing whether to interpret undefined as being unset or having
 * never been set.
 * */
export const ifUndef = neverThese([undefined] as const);

/** Returns the fallback if `val` is undefined */
export const neverInherit = neverThese(["inherit"] as const);

/**
 * If the cb returns any value other than undefined, `val` is assigned to the
 * return
 * */
export const ifMut = <T>(val: T, cb: (next: T) => T | undefined) => {
    const result = cb(val);
    return result === undefined ? val : result;
};
