type Enum<T extends string> = { [P in T]: T };

export function stringEnum<T extends string>(...p: T[]): Readonly<Enum<T>> {
    const result = {} as Enum<T>;

    for (let i = 0; i < p.length; ++i) {
        result[p[i]] = p[i];
    }

    return result;
}
