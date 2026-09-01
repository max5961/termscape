export type _Omit<T extends object, U extends keyof T> = Omit<T, U>;
export type _Pick<T extends object, U extends keyof T> = Pick<T, U>;
export type _Exclude<T, U extends T> = Exclude<T, U>;
export type _Extract<T, U extends T> = Extract<T, U>;

export function objectKeys<T extends object>(o: T) {
    return Object.keys(o) as (keyof T)[];
}

export function objectEntries<T extends object>(obj: T) {
    return Object.entries(obj) as [keyof T, T[keyof T]][];
}
