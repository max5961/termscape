import { HandleData, HandleParsed, ParsedData } from "./types.js";

export class InputProvider {
    private stdin: NodeJS.ReadStream;
    private consumers: Set<Input>;

    private static _instance: InputProvider;
    private static _isPaused: boolean;

    private constructor(readable?: NodeJS.ReadStream) {
        this.stdin = readable ?? process.stdin;
        this.consumers = new Set();

        InputProvider._isPaused = true;
    }

    public static get instance(): InputProvider {
        if (!InputProvider._instance) {
            InputProvider._instance = new InputProvider();
        }

        return InputProvider._instance;
    }

    public static get isPaused(): boolean {
        return this._isPaused;
    }

    public resume = () => {
        this.stdin.resume();
        this.stdin.setRawMode(true);
        this.stdin.on("data", this.handleData);

        InputProvider._isPaused = false;
    };

    public pause = () => {
        this.stdin.pause();
        this.stdin.off("data", this.handleData);

        InputProvider._isPaused = true;
    };

    public addConsumer = (consumer: Input) => {
        this.consumers.add(consumer);
    };

    public deleteConsumer = (consumer: Input) => {
        this.consumers.delete(consumer);
    };

    private handleData = (buf: Buffer) => {
        const parsed = this.parseData(buf);

        for (const consumer of this.consumers) {
            const handleData = consumer.handleData;
            const handleParsed = consumer.handleParsed;

            handleData(buf);
            handleParsed(parsed);
        }
    };

    public updateSource = (stream: NodeJS.ReadStream) => {
        this.pause();
        this.stdin = stream;
        this.resume();
    };

    private parseData = (buf: Buffer): ParsedData => {
        const parsed = {} as ParsedData;

        const utf = buf.toString("utf8");
        if (buf.length === 1) {
            // Check Ascii match
            // Check string match
            // Check Ctrl + key match
        } else {
            parsed.input = utf;
        }

        return parsed;
    };
}

export class Input {
    private onData: HandleData;
    private onParsed: HandleParsed;
    private _isPaused: boolean;

    constructor(opts?: { onData: HandleData; onParsed: HandleParsed }) {
        this._isPaused = false;
        const provider = InputProvider.instance;
        provider.addConsumer(this);

        this.onData =
            opts?.onData ??
            function (buf) {
                //
            };

        this.onParsed =
            opts?.onParsed ??
            function ({ input, key }) {
                //
            };
    }

    public get handleData(): HandleData {
        return this.onData;
    }

    public get handleParsed(): HandleParsed {
        return this.onParsed;
    }

    // Allow custom handling of data
    public set handleData(cb: HandleData) {
        this.onData = cb;
    }

    // Allow custom handling of parsed data
    public set handleParsed(cb: HandleParsed) {
        this.onParsed = cb;
    }

    public get isPaused(): boolean {
        return this._isPaused;
    }

    public pause(): void {
        this._isPaused = true;
    }

    public resume(): void {
        this._isPaused = false;
    }
}
