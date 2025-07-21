import chalk from "chalk";
import { Color } from "../util/types.js";

export function glyphFactory(): {
    color?: Color;
    backgroundColor?: Color;
    bold?: boolean;
    dimColor?: boolean;
    create(char: string): string;
    reset(): void;
} {
    const defaults = {
        color: undefined,
        backgroundColor: undefined,
        bold: false,
        dimColor: false,
    } as Glyph;

    return {
        ...defaults,
        create(char: string): string {
            if (this.bold) {
                char = chalk.bold(char);
            }
            if (this.dimColor) {
                char = chalk.dim(char);
            }
            if (this.color && chalk[this.color]) {
                char = chalk[this.color](char);
            }
            if (this.backgroundColor) {
                const postfix =
                    this.backgroundColor[0].toUpperCase() + this.backgroundColor.slice(1);
                const method = `bg${postfix}`;
                // @ts-expect-error bcuz...
                char = chalk[method]?.(char) ?? char;
            }

            return char;
        },
        reset() {
            this.color = defaults.color;
            this.backgroundColor = defaults.backgroundColor;
            this.bold = defaults.bold;
            this.dimColor = defaults.dimColor;
        },
    };
}

export type Glyph = ReturnType<typeof glyphFactory>;
