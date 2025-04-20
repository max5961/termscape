import { Color } from "../util/types.ts";
import { Layout } from "./Layout.ts";

export {};

declare global {
    type GlyphConfig = {
        char: string;
        color?: Color;
        backgroundColor?: Color;
        bold?: boolean;
        dimColor?: boolean;
    };

    type RenderLayer = ReturnType<Layout["getRenderLayer"]>;

    type Overflow = { x: number; y: number };
}
