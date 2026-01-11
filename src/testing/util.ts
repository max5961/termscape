import fs from "node:fs";
import path from "node:path";
import { Ansi } from "../shared/Ansi.js";
import { type RecordType } from "./configureSnapshot.js";
import { TestRoot } from "./TestRoot.js";

function drawFrame(frame: string, idx: number) {
    const line = "\n" + "─".repeat(process.stdout.columns) + "\n";
    process.stdout.write(`${line} Frame ${idx} ↓${line}${frame}`);
}

function drawTestName(name: string) {
    process.stdout.write(Ansi.format(name + "\n", ["yellow"]));
}

export function getDisplayName(desc: string, name: string) {
    return `${desc} - ${name}`;
}

export function snapshotName(desc: string, name: string, type: RecordType) {
    const fmt = (s: string) => s.split(" ").join("-");
    return path.join(
        process.cwd(),
        `test/snapshots/${fmt(desc)}/${fmt(name)}.snapshot.${type}`,
    );
}

export function getFile(...args: Parameters<typeof snapshotName>) {
    return fs.readFileSync(snapshotName(...args), "utf8");
}

export function rmFile(...args: Parameters<typeof snapshotName>) {
    fs.rmSync(snapshotName(...args));
}

export function getParsedFrames(frames: string | string[]): string[] {
    if (Array.isArray(frames)) {
        frames = frames.join("");
    }

    return frames.split(TestRoot.Frame).filter((frame) => frame);
}

export function playFrames(frames: string[], name?: string) {
    if (name) drawTestName(name);

    frames.forEach((frame, idx) => {
        drawFrame(frame, idx + 1);
    });
}

export function playFramesInteractive(frames: string[], nextKey: string, name?: string) {
    if (name) {
        drawTestName(name + "\n");
    }

    process.stdout.write("Interactive snapshot viewer\n");
    process.stdout.write(
        `Press ${Ansi.format(nextKey, ["green"])} to advance frames (press once to start).\n`,
    );

    if (!frames.length) process.stdout.write("No frames recorded\n");

    let i = 0;
    const handleStdin = (buf: Buffer) => {
        const off = () => {
            process.stdin.setRawMode(false);
            process.stdin.pause();
            process.stdin.removeListener("data", handleStdin);
        };

        if (buf[0] === 3) return off();
        if (buf.toString("utf8") !== nextKey) return;

        const frame = frames.shift();
        if (!frame) return off();

        drawFrame(frame, ++i);

        if (!frames.length) return off();
    };

    process.stdin.resume();
    process.stdin.setRawMode(true);
    process.stdin.on("data", handleStdin);
}

type BaseArgs = { suite: string; test: string; type: RecordType };
export function replaySuite<T extends "auto" | "interactive">(
    mode: T,
): T extends "auto"
    ? (args: BaseArgs) => void
    : (args: BaseArgs & { nextKey: string }) => void {
    const handle = (args: BaseArgs & { nextKey?: string }) => {
        const snapshot = snapshotName(args.suite, args.test, args.type);
        const rawFrames = fs.readFileSync(snapshot, "utf8");
        const parsedFrames = getParsedFrames(rawFrames);
        const name = getDisplayName(args.suite, args.test);

        if (mode === "auto") {
            playFrames(parsedFrames, name);
        } else if (mode === "interactive" && args.nextKey) {
            playFramesInteractive(parsedFrames, args.nextKey, name);
        }
    };

    return handle;
}
