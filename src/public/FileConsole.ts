import chalk from "chalk";
import fs from "node:fs";
import path from "node:path";

export class FileConsole {
    private _file: string;
    private _time: boolean | (() => string);
    private _color?: string;
    private _prefix?: string;
    private _prefixColor?: string;

    constructor(file?: string) {
        this._file = file ?? "console.log";
        this._time = true;
        this._color = undefined;
        this._prefix = undefined;
        this._prefixColor = undefined;
    }

    public setFile(file: string): FileConsole {
        this._file = file;
        return this;
    }

    public setTime(time: boolean | (() => string)): FileConsole {
        this._time = time;
        return this;
    }

    public setColor(color?: string): FileConsole {
        this._color = color;
        return this;
    }

    public setPrefix(prefix?: string): FileConsole {
        this._prefix = prefix;
        return this;
    }

    public setPrefixColor(prefixColor?: string): FileConsole {
        this._prefixColor = prefixColor;
        return this;
    }

    private getPrototype(): FileConsole {
        return Object.setPrototypeOf({}, this);
    }

    public file(file: string): FileConsole {
        return this.getPrototype().setFile(file);
    }

    public time(time: FileConsole["_time"]): FileConsole {
        return this.getPrototype().setTime(time);
    }

    public color(color: FileConsole["_color"]): FileConsole {
        return this.getPrototype().setColor(color);
    }

    public prefix(prefix: FileConsole["_prefix"]): FileConsole {
        return this.getPrototype().setPrefix(prefix);
    }

    public prefixColor(prefixColor: FileConsole["_prefixColor"]): FileConsole {
        return this.getPrototype().setPrefix(prefixColor);
    }

    public write(...data: unknown[]): void {
        this.validatePath(this._file);
        const prefix = this.getPrefix();
        const time = this.getTime();
        const dataString = this.getDataString(...data);
        const sp = (s: string) => (s ? " " : "");

        const toWrite = this.colorText(
            `${time}${sp(time)}${prefix}${sp(prefix)}${dataString}`,
        );

        fs.appendFileSync(
            this._file,
            // formatted JSON adds a \n, so check if one exists before adding
            toWrite + `${toWrite.endsWith("\n") ? "" : "\n"}`,
            "utf-8",
        );
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
                        cache.push(JSON.stringify(curr, null, 4) + "\n");
                    } else {
                        cache.push(stringified);
                    }
                } catch (err) {
                    if (err instanceof Error) {
                        cache.push(err.message);
                    } else {
                        cache.push("FileConsole error");
                    }
                }
            }

            return getData(data, cache);
        };

        return getData(data).join(", ");
    }

    private getTime(): string {
        if (!this._time) return "";
        if (typeof this._time === "function") return this._time();

        const date = new Date();
        const h = date.getHours().toString().padStart(2, "0");
        const m = date.getMinutes().toString().padStart(2, "0");
        const s = date.getSeconds().toString().padStart(2, "0");
        const ms = date.getMilliseconds().toString().padStart(3, "0");

        return `${h}:${m}:${s}:${ms}`;
    }

    private getPrefix(): string {
        if (!this._prefix) return "";

        return this.colorText(`${this._prefix} ⇒`, this._prefixColor);
    }

    private validatePath(file: string): void {
        let filePath = path.resolve(file);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        this._file = filePath;
        if (!fs.statSync(file).isFile()) {
            const fd = fs.openSync(filePath, "a");
            fs.closeSync(fd);
        }
    }

    public getPath(): string {
        this.validatePath(this._file);
        return this._file;
    }

    private colorText(value: string, color?: FileConsole["_color"]): string {
        color = color ?? this._color;
        const isHex = color?.startsWith("#");

        if (isHex) {
            return chalk.hex(color!)(value);
        } else {
            // @ts-ignore
            return chalk[color ?? ""]?.(value) ?? value;
        }
    }
}
