import chalk from "chalk";
import fs from "node:fs";
import path from "node:path";
import { parseRgb } from "../util/parseRgb.js";

type Configuration = {
    file?: string;
    time?: boolean | (() => string);
    color?: string;
    warnColor?: string;
    errorColor?: string;
    prefix?: string;
    prefixSeparator?: string;
};

type Profiles<T extends string> = Record<T, Configuration>;

export class Logger<T extends string> {
    private default: Configuration;
    private profiles: Map<string, Configuration>;

    constructor(c?: Configuration) {
        this.default = {};
        this.profiles = new Map();
        this.setDefaultProfile(c ?? {});
    }

    public setDefaultProfile(c: Configuration): void {
        this.assignProfile(c, this.default);
    }

    public defineProfiles(profiles: Profiles<T>): void {
        for (const [profile, config] of Object.entries(profiles)) {
            if (config) {
                this.profiles.set(profile, this.assignProfile(config, {}));
            }
        }
    }

    public use(profileName: T): Logger<string> {
        const config = this.profiles.get(profileName);
        if (config) {
            return new Logger(config);
        } else {
            return this;
        }
    }

    public getProfile(profileName: T): Logger<string>;
    public getProfile(profileName: string): Logger<string> | undefined;
    public getProfile(profileName: string): Logger<string> | undefined {
        const config = this.profiles.get(profileName);
        if (config) {
            return new Logger(config);
        } else {
            return undefined;
        }
    }

    public getFilePath(profileName?: T): string {
        const config = this.profiles.get(profileName ?? "") ?? this.default;
        return config.file!;
    }

    public write(...data: unknown[]): void {
        const fullString = this.getFullString(...data);
        const coloredString = this.colorString(fullString, this.default.color);
        this.appendFile(this.default.file!, coloredString);
    }

    public warn(...data: unknown[]): void {
        const fullString = this.getFullString(...data);
        const coloredString = this.colorString(fullString, this.default.warnColor);
        this.appendFile(this.default.file!, coloredString);
    }

    public error(...data: unknown[]): void {
        const fullString = this.getFullString(...data);
        const coloredString = this.colorString(fullString, this.default.errorColor);
        this.appendFile(this.default.file!, coloredString);
    }

    private assignProfile(c: Configuration, t: Configuration): Configuration {
        t.file = t.file ?? "console.log";
        t.time = c.time ?? (() => this.getTime());
        t.color = c.color ?? "";
        t.warnColor = c.warnColor ?? "yellow";
        t.errorColor = c.errorColor ?? "red";
        t.prefix = c.prefix ?? "";
        t.prefixSeparator = c.prefixSeparator ?? "";
        return t;
    }

    private getDataString(...data: unknown[]): string {
        const getData = (data: unknown[], cache = [] as string[]) => {
            if (!data.length) return cache;

            const curr = data.shift();

            if (curr === undefined) {
                cache.push("undefined");
            }

            if (curr === null) {
                cache.push("null");
            }

            if (
                typeof curr === "string" ||
                typeof curr === "number" ||
                typeof curr === "boolean" ||
                typeof curr === "function" ||
                typeof curr === "symbol"
            ) {
                cache.push(String(curr));
            }

            if (typeof curr === "bigint") {
                cache.push(curr.toString() + "n");
            }

            if (curr && typeof curr === "object") {
                try {
                    const stringified = JSON.stringify(curr);
                    if (stringified.length > 25) {
                        // If pushing a formatted JSON add a \n for clarity in case
                        // there are other arguments
                        const end = data.length ? ",\n" : "\n";
                        cache.push(JSON.stringify(curr, null, 4) + end);
                    } else {
                        cache.push(stringified);
                    }
                } catch (err) {
                    if (err instanceof Error) {
                        cache.push(err.message);
                    } else {
                        cache.push("Logger error");
                    }
                }
            }

            return getData(data, cache);
        };

        const arr = getData(data);
        return arr
            .map((d, idx) => {
                if (idx >= arr.length - 1) {
                    return d;
                }
                if (d.endsWith("\n")) {
                    return d;
                } else {
                    return d + ", ";
                }
            })
            .join("");
    }

    private getFullString(...data: unknown[]): string {
        let time = "";
        if (typeof this.default.time === "function") {
            time = this.default.time();
        }

        const prefix = this.default.prefix!;
        const prefixSeparator = this.default.prefixSeparator!;
        const dataString = this.getDataString(...data);

        let str = "";
        if (time) str += time + " ";
        if (prefix) str += prefix + " ";
        if (prefixSeparator) str += prefixSeparator + " ";
        str += dataString;

        return str;
    }

    private validatePath(file: string): string {
        let fpath = path.resolve(file);
        fs.mkdirSync(path.dirname(fpath), { recursive: true });

        return fpath;
    }

    private getTime(): string {
        const date = new Date();
        const h = date.getHours().toString().padStart(2, "0");
        const m = date.getMinutes().toString().padStart(2, "0");
        const s = date.getSeconds().toString().padStart(2, "0");
        const ms = date.getMilliseconds().toString().padStart(3, "0");

        return `${h}:${m}:${s}:${ms}:`;
    }

    private colorString(s: string, color?: Configuration["color"]): string {
        if (!color) return s;

        color = color.trim();

        // Hex
        if (color.startsWith("#")) {
            return chalk.hex(color)(s);
        }

        // rgb
        const rgb = parseRgb(color);
        if (rgb) {
            return chalk.rgb(...rgb)(s);
        }

        return (chalk as any)[color]?.(s) ?? s;
    }

    private appendFile(file: string, str: string): void {
        file = this.validatePath(file);

        fs.appendFileSync(
            file,
            // formatted JSON adds a \n, so check if one exists before adding
            str + `${str.endsWith("\n") ? "" : "\n"}`,
            "utf-8",
        );
    }
}

export const logger = new Logger();
