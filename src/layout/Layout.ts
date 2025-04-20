import { DomElement } from "../dom/DomElement.js";
import { BoxStyle } from "../dom/elements/attributes/box/BoxStyle.js";

/*
 * The renderNode function is passed a new Layout object.  On every recursive
 * layer, getLayout updates the context and returns an api to draw with.  This
 * forces updated context for every tree node being rendered.
 * */
export class Layout {
    private stdout: NodeJS.WriteStream;
    private grid: string[][];
    private deepestColumn: number;
    private pos: { x: number; y: number };

    constructor(stdout: NodeJS.WriteStream) {
        this.stdout = stdout;

        this.grid = Array.from({ length: this.stdout.rows }).map((_row) => {
            return Array.from({ length: this.stdout.columns }).fill(" ");
        }) as string[][];

        this.deepestColumn = 0;
        this.pos = { x: 0, y: 0 };
    }

    // Overflow context should ideally be closured in with recursion. Would be a
    // huge PITA/impossible to not overwrite overflow context without recursion
    public getRenderLayer(x: number, y: number, node: DomElement, overflow?: Overflow) {
        // Update the context
        this.deepestColumn = Math.max(
            x + node.node.getComputedHeight(),
            this.deepestColumn,
        );
        this.pos.x = x;
        this.pos.y = y;

        // Handle setting overflow bounds.  Setting Yoga overflow wont help here...
        let bounds = { x: Infinity, y: Infinity };
        const style = node.props.style as BoxStyle;
        if (style.overflow) {
            bounds.x = x + node.node.getComputedHeight();
            bounds.y = y + node.node.getComputedWidth();
        } else if (style.overflowX) {
            bounds.x = x + node.node.getComputedWidth();
        } else if (style.overflowY) {
            bounds.y = y + node.node.getComputedHeight();
        }

        const localBounds = bounds ?? { x: Infinity, y: Infinity };

        const moveTo = (x: number, y: number): void => {
            this.pos.x = x;
            this.pos.y = y;
        };

        const draw = (glyph: Glyph, dir: "U" | "D" | "L" | "R", length: number): void => {
            const char = glyph.render();

            let dx = 0;
            let dy = 0;
            if (dir === "U") dx = 1;
            if (dir === "D") dx = -1;
            if (dir === "L") dy = -1;
            if (dir === "R") dy = 1;

            let { x, y } = this.pos;

            for (let i = 0; i < length; ++i) {
                if (x < localBounds.x && y < localBounds.y && this.grid[x]?.[y]) {
                    this.grid[x][y] = char;
                }
                x += dx;
                y += dy;
            }
        };

        if (overflow) {
            //
        }

        return {
            moveTo,
            draw,
        };
    }

    public getOutputString(): string {
        const rows = this.grid.map((row) => row.join("").trimEnd() + "\n");
        let output = "";
        for (let i = 0; i < this.deepestColumn; ++i) {
            output += rows[i];
        }

        return output;
    }

    public writeToStdout(s: string): void {
        this.stdout.write(s);
    }
}

class Glyph {
    private char!: string;

    constructor(glyph: GlyphConfig) {
        this.char = this.setGlyph(glyph);
    }

    public setGlyph(glyph: GlyphConfig): string {
        // TODO: Actually apply the ansi styles to brush
        this.char = glyph.char;

        return this.char;
    }

    public render(): string {
        return this.char;
    }
}
