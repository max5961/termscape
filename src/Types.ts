import type { Ansi } from "./core/Ansi.js";

export type { Node as YogaNode, Edge } from "yoga-wasm-web/auto";
export type Point = { x: number; y: number };
export type WriteMode = "refresh" | "row" | "cell";

export interface ProcessLike {
    stdout: StdoutLike;
    stdin: StdinLike;
    env?: Record<string, string | undefined>;
    nextTick(cb: () => unknown, ...args: any[]): void;
    on(e: "exit" | "SIGINT", cb: () => unknown): void;
    off(e: "exit" | "SIGINT", cb: () => unknown): void;
}
export interface StdoutLike {
    on(e: "resize", cb: () => unknown): void;
    off(e: "resize", cb: () => unknown): void;
    write(d: string | Buffer): void;
    setMaxListeners(n: number): StdoutLike;
    rows: number;
    columns: number;
}
export interface StdinLike {
    on(e: "data", cb: (buf: Buffer) => unknown): void;
    off(e: "data", cb: (bf: Buffer) => unknown): void;
    pause(): void;
    resume(): void;
    setRawMode(v: boolean): void;
}

type _ExtendsProcessLike<T extends ProcessLike> = T;
type _ExtendsStdoutLike<T extends StdoutLike> = T;
type _ExtendsStdinLike<T extends StdinLike> = T;
type _ProcessLikeTypeCheck = _ExtendsProcessLike<typeof process>;
type _StdoutLikeTypeCheck = _ExtendsStdoutLike<typeof process.stdout>;
type _StdinLikeTypeCheck = _ExtendsStdinLike<typeof process.stdin>;

export type Color = keyof typeof Ansi.color;
export type HexColor = `#${string}`;
export type RgbColor = `rgb(${string}`;
export type ColorValue = Color | HexColor | RgbColor;
