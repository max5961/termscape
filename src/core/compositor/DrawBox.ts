import { DrawOperation } from "./DrawOperation.js";
import type { Canvas } from "../canvas/Canvas.js";
import type { CoreElement } from "../CoreElement.js";
import { getBorder } from "../Boxes.js";

export class DrawBox extends DrawOperation {
    public override compose(core: CoreElement, canvas: Canvas): void {
        if (core.shadow.backgroundColor) {
            this.drawBackground(core, canvas);
        }

        if (core.shadow.borderStyle) {
            this.drawBorder(core, canvas);
        }
    }

    private drawBorder(core: CoreElement, canvas: Canvas) {
        const width = core.shadow.computedWidth;
        const height = core.shadow.computedHeight;

        const map = getBorder(core.shadow.borderStyle!);

        const pen = canvas.getPen();

        pen.setStyle({
            color: core.shadow.borderTopColor,
            dimColor: core.shadow.borderTopDimColor,
        })
            .draw(map.topLeft, "r", 1)
            .draw(map.top, "r", width - 2)
            .draw(map.topRight, "d", 1);

        pen.setStyle({
            color: core.shadow.borderRightColor,
            dimColor: core.shadow.borderRightDimColor,
        }).draw(map.right, "d", height - 2);

        pen.setStyle({
            color: core.shadow.borderBottomColor,
            dimColor: core.shadow.borderBottomDimColor,
        })
            .draw(map.bottomRight, "l", 1)
            .draw(map.bottom, "l", width - 2)
            .draw(map.bottomLeft, "u", 1);

        pen.setStyle({
            color: core.shadow.borderLeftColor,
            dimColor: core.shadow.borderLeftDimColor,
        }).draw(map.left, "u", height - 2);
    }

    private drawBackground(core: CoreElement, canvas: Canvas): void {
        const pen = canvas.getPen();
        const height = canvas.ygHeight;
        const width = canvas.ygWidth;

        pen.setStyle({ backgroundColor: core.shadow.backgroundColor });

        for (let y = 0; y < height; ++y) {
            pen.moveTo(0, y);
            pen.draw(" ", "r", width);
        }
    }
}
