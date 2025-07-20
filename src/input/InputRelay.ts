type Data = any;
const parseBuffer = (buf: Buffer) => {};

export class InputRelay {
    protected _stream: NodeJS.ReadStream;
    protected provider: NodeJS.ReadStream | InputRelay;
    protected consumers: Set<InputRelay>;
    public handleData?: (data: Data) => unknown;

    constructor(stream: NodeJS.ReadStream | InputRelay) {
        this.consumers = new Set();

        if (stream instanceof InputRelay) {
            const provider = stream;

            this._stream = provider._stream;
            provider.consumers.add(this);
        } else {
            this._stream = stream;
            this._stream.on("data", this.handleBuffer);
        }

        this.provider = stream;
    }

    public get stream(): NodeJS.ReadStream {
        return this._stream;
    }

    public detach(): void {
        if (this.provider instanceof InputRelay) {
            this.provider.consumers.delete(this);
        } else {
            this._stream.off("data", this.handleBuffer);
        }
    }

    private handleBuffer(buf: Buffer): void {
        const data = parseBuffer(buf);

        for (const consumer of this.consumers) {
            // add conditional in case consumer paused
            consumer.handleData?.(data);
        }
    }
}

const provider = new InputRelay(process.stdin);
const consumer = new InputRelay(provider);

consumer.handleData = (_data) => {
    /*...*/
};

const lowerConsumer = new InputRelay(consumer);
