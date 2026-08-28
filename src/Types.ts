export type { Node as YogaNode, Edge } from "yoga-wasm-web/auto";
export type { Color, BgColor, TextEffect, AnsiStyle } from "ansi-escape-sequences";
export type Stdout = NodeJS.WriteStream & { fd: 1 };
export type Stdin = NodeJS.ReadStream & { fd: 0 };
