import { TagNames } from "./dom/DomElement.ts";
import { BoxElement } from "./dom/elements/BoxElement.ts";

declare global {
    namespace JSX {
        interface IntrinsicElement {
            [TagNames.Box]: BoxElement;
            [TagNames.Text]: TextElement;
        }
    }
}
