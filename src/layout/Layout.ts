import { DomElement } from "../dom/DomElement.js";
import { BoxStyle } from "../dom/elements/attributes/box/BoxStyle.js";

/*
 * createGetRenderLayer returns a function we will call getRenderLayer which is a
 * recursive factory function that contains an api for drawing to the grid.  On
 * every render a new Layout object is created and getRenderLayer is passed to the
 * recursive renderNode function.  Each new rendered node passed layer.getRenderLayer
 * to its child nodes.
 *
 * Reasons for this:
 * 1. Each node gets an api to draw to the grid that has relevant overflow context
 * so that its easy to keep the draw function from going out of bounds
 * 2. Other context that would be tedious to reset such as pos and increasing the
 * columns is updated automatically.  pos gets set to the TL corner position of
 * the node (layer.moveTo still exists to change that if desired)
 * */
export class Layout {
    private stdout: NodeJS.WriteStream;
    private grid: string[][];
    private deepestColumn: number;
    private pos: { x: number; y: number };

    constructor(stdout: NodeJS.WriteStream) {
        this.stdout = stdout;

        // Could consider pushing new rows when necessary instead of using the
        // deepestColumn...
        this.grid = Array.from({ length: this.stdout.rows }).map((_row) => {
            return Array.from({ length: this.stdout.columns }).fill(" ");
        }) as string[][];

        this.deepestColumn = 0;
        this.pos = { x: 0, y: 0 };
    }

    public createGetRenderLayer = (
        bounds: OverflowBounds = { x: Infinity, y: Infinity },
    ) => {
        // anonymous - getRenderLayer
        return (x: number, y: number, node: DomElement) => {
            // Update the context
            this.deepestColumn = Math.max(
                x + node.node.getComputedHeight(),
                this.deepestColumn,
            );
            this.pos.x = x;
            this.pos.y = y;

            // Handle setting local overflow bounds
            const localBounds = { ...bounds };
            const { overflow, overflowX, overflowY } = node.props.style as BoxStyle;
            if (overflow === "hidden") {
                localBounds.x = node.node.getComputedWidth();
                localBounds.y = node.node.getComputedHeight();
            }
            if (overflowX) {
                localBounds.x = overflowX === "visible" ? bounds.x : localBounds.x;
            }
            if (overflowY) {
                localBounds.y = overflowY === "visible" ? bounds.y : localBounds.y;
            }

            // API fn
            const moveTo = (x: number, y: number): void => {
                this.pos.x = x;
                this.pos.y = y;
            };

            // API fn
            const draw = (
                glyph: Glyph,
                dir: "U" | "D" | "L" | "R",
                length: number,
            ): void => {
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

            return {
                moveTo,
                draw,
                getRenderLayer: this.createGetRenderLayer(localBounds),
            };
        };
    };

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
