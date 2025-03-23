import { describe, expect, test } from "vitest";
import Border, { IBorder } from "@src/util/Borders.js";

describe("Border chars are correct", () => {
    test("single", () => {
        expect(draw(Border.single)).toBe("┌─┐\n│ │\n└─┘");
    });

    test("bold", () => {
        expect(draw(Border.bold)).toBe("┏━┓\n┃ ┃\n┗━┛");
    });

    test("round", () => {
        expect(draw(Border.round)).toBe("╭─╮\n│ │\n╰─╯");
    });

    test("double", () => {
        expect(draw(Border.double)).toBe("╔═╗\n║ ║\n╚═╝");
    });
});

function draw(border: IBorder): string {
    let box = "";
    box += border.topLeft + border.top + border.topRight + "\n";
    box += border.left + " " + border.right + "\n";
    box += border.bottomLeft + border.bottom + border.bottomRight;
    return box;
}
